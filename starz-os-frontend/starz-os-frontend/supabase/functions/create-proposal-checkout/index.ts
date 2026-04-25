import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Load env vars
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const appUrl = Deno.env.get("APP_URL") || "http://localhost:3000";

    if (!stripeSecret || !supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize clients
    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Parse & validate body
    const body = await req.json();
    const { proposalId } = body;

    if (!proposalId || typeof proposalId !== "string") {
      return new Response(
        JSON.stringify({ error: "Valid proposalId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 🔒 Optional: Verify JWT token for authorization
    // const authHeader = req.headers.get("authorization");
    // const token = authHeader?.replace("Bearer ", "");
    // if (!token) { return 401... }

    // Fetch proposal with row-level lock (if using pg_advisory_lock or status check)
    const { data: proposal, error: proposalError } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", proposalId)
      .single();

    if (proposalError || !proposal) {
      return new Response(
        JSON.stringify({ error: "Proposal not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 🛡️ Prevent duplicate sessions
    if (proposal.stripe_session_id && proposal.status !== "draft") {
      // Return existing session instead of creating new one
      return new Response(
        JSON.stringify({ 
          url: proposal.stripe_checkout_url, 
          sessionId: proposal.stripe_session_id,
          message: "Using existing checkout session" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate amount
    const amount = Number(proposal.amount);
    if (!amount || amount <= 0 || amount > 999999.99) {
      return new Response(
        JSON.stringify({ error: "Invalid proposal amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${appUrl}/proposal/${proposal.id}?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/proposal/${proposal.id}?cancelled=1`,
      customer_email: proposal.signer_email || undefined,
      line_items: [
        {
          price_data: {
            currency: (proposal.currency || "usd").toLowerCase(),
            product_data: {
              name: proposal.title || "Service Proposal",
              description: proposal.description?.slice(0, 500) || "Traffik Boosters service proposal",
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        proposal_id: proposal.id,
        deal_id: proposal.deal_id || "",
        lead_id: proposal.lead_id || "",
        service_type: proposal.service_type || "",
      },
      // Optional: Enable automatic tax calculation
      // automatic_tax: { enabled: true },
      // Optional: Collect phone/address
      // phone_number_collection: { enabled: true },
    });

    // Update proposal atomically
    const { error: updateError } = await supabase
      .from("proposals")
      .update({
        stripe_checkout_url: session.url,
        stripe_session_id: session.id,
        status: proposal.status === "draft" ? "sent" : proposal.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposal.id)
      // Prevent overwriting if another request already created a session
      .is("stripe_session_id", null); 

    if (updateError) {
      // If update failed due to race condition, return existing session
      const { data: existing } = await supabase
        .from("proposals")
        .select("stripe_checkout_url, stripe_session_id")
        .eq("id", proposalId)
        .single();
        
      if (existing?.stripe_session_id) {
        return new Response(
          JSON.stringify({ 
            url: existing.stripe_checkout_url, 
            sessionId: existing.stripe_session_id 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to save checkout session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Checkout session error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});