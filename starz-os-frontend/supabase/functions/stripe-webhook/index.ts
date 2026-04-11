import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";
import { createClient } from "npm:@supabase/supabase-js@2";

export const config = {
  verify_jwt: false, // Webhooks don't use JWT
};

// Idempotency cache (in-memory for edge function instance)
const processedEvents = new Set<string>();

Deno.serve(async (req: Request) => {
  // Basic CORS for any unexpected browser requests
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // =============================
    // 🔐 ENV + INIT
    // =============================
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const RESEND_KEY = Deno.env.get("RESEND_API_KEY");

    if (!stripeSecret || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
      return new Response("Missing env vars", { status: 500 });
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2023-10-16",
    });

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // =============================
    // 🔐 VERIFY STRIPE SIGNATURE
    // =============================
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Missing stripe-signature", { status: 400 });
    }

    const body = await req.text();

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Webhook signature verification failed:", msg);
      return new Response(`Webhook signature error: ${msg}`, { status: 400 });
    }

    // =============================
    // 🔄 IDEMPOTENCY CHECK
    // =============================
    // Skip if we already processed this event in this instance
    if (processedEvents.has(event.id)) {
      console.log("⚡ Duplicate event detected (memory):", event.id);
      return new Response("ok", { status: 200 });
    }

    // Check database for processed event
    const { data: existingEvent } = await supabase
      .from("processed_webhook_events")
      .select("id")
      .eq("stripe_event_id", event.id)
      .maybeSingle();

    if (existingEvent) {
      console.log("⚡ Duplicate event detected (database):", event.id);
      return new Response("ok", { status: 200 });
    }

    // =============================
    // 💰 HANDLE PAYMENT EVENTS (DEBOUNCE)
    // =============================
    // Only process checkout.session.completed, ignore payment_intent.succeeded 
    // for the same flow to prevent duplicates
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata || {};

      // =============================
      // 📊 COMMON DATA EXTRACTION
      // =============================
      const customerEmail = session.customer_email || session.customer_details?.email || null;
      const businessName = metadata.business_name || metadata.company || customerEmail || "New Client";
      const phone = metadata.phone || session.customer_details?.phone || null;
      const pkg = metadata.package || "Digital Marketing Package";
      
      // Amount in cents -> dollars
      const amountPaid = (session.amount_total || 0) / 100;
      const totalAmount = metadata.total_amount 
        ? parseFloat(metadata.total_amount) 
        : amountPaid;

      const probationEndsAt = new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000
      ).toISOString();

      // =============================
      // 🧠 CASE 1: PROPOSAL PAYMENT FLOW
      // =============================
      const proposalId = metadata.proposal_id;

      if (proposalId) {
        console.log("🔥 Processing proposal payment:", proposalId);

        // Use RPC for atomic transaction or lock
        const { data: result, error: rpcError } = await supabase.rpc(
          "process_proposal_payment",
          {
            p_proposal_id: proposalId,
            p_stripe_session_id: session.id,
            p_amount: totalAmount,
            p_customer_email: customerEmail,
          }
        );

        if (rpcError) {
          console.error("RPC error:", rpcError.message);
          
          // Fallback to manual processing with row lock
          const { data: proposal, error: fetchError } = await supabase
            .from("proposals")
            .select("*")
            .eq("id", proposalId)
            .single();

          if (fetchError || !proposal) {
            throw new Error(`Proposal not found: ${proposalId}`);
          }

          // Skip if already paid (idempotency)
          if (proposal.status === "paid") {
            console.log("Proposal already paid, skipping:", proposalId);
          } else {
            // Update proposal status
            const { error: updateError } = await supabase
              .from("proposals")
              .update({
                status: "paid",
                stripe_session_id: session.id,
                paid_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", proposal.id)
              .eq("status", "sent"); // Only update if still "sent"

            if (updateError) {
              throw new Error(`Failed to update proposal: ${updateError.message}`);
            }

            // Create work order (check first to prevent duplicates)
            const { data: existingWO } = await supabase
              .from("work_orders")
              .select("id")
              .eq("proposal_id", proposal.id)
              .maybeSingle();

            if (!existingWO) {
              const { data: workOrder, error: woError } = await supabase
                .from("work_orders")
                .insert({
                  proposal_id: proposal.id,
                  deal_id: proposal.deal_id,
                  lead_id: proposal.lead_id,
                  partner_name: proposal.signer_name,
                  company_name: proposal.title,
                  service_type: proposal.service_type,
                  title: proposal.title,
                  deposit_amount: proposal.amount,
                  total_amount: proposal.amount,
                  status: "active",
                  progress: 5,
                  created_at: new Date().toISOString(),
                })
                .select()
                .single();

              if (woError) {
                throw new Error(`Work order creation failed: ${woError.message}`);
              }

              // Create tasks
              await supabase.rpc("create_tasks_for_work_order", {
                p_work_order_id: workOrder.id,
              });

              // Client portal update
              await supabase.from("client_portal_updates").insert({
                work_order_id: workOrder.id,
                title: "Payment received",
                message: "Your deposit was received and your project is now in production.",
                visibility: "partner",
                event_type: "invoice",
                created_by: "system",
                created_at: new Date().toISOString(),
              });
            }
          }
        }
      }

      // =============================
      // 🧠 CASE 2: LEGACY DIRECT PAYMENT FLOW
      // =============================
      else {
        console.log("🔥 Processing legacy payment flow");

        // Check for existing work order with this payment ID
        const { data: existingWO } = await supabase
          .schema("deals")
          .from("work_orders")
          .select("id")
          .eq("stripe_payment_id", session.id)
          .maybeSingle();

        if (existingWO) {
          console.log("Legacy work order already exists for:", session.id);
        } else {
          const { error } = await supabase
            .schema("deals")
            .from("work_orders")
            .insert({
              client_name: metadata.client_name || businessName,
              business_name: businessName,
              email: customerEmail,
              phone,
              package: pkg,
              status: "probation",
              payment_status: "paid",
              total_amount: totalAmount,
              deposit_amount: Math.round(totalAmount * 0.3),
              monthly_amount: Math.round(totalAmount * 0.4),
              signed_at: new Date().toISOString(),
              paid_at: new Date().toISOString(),
              clearance_ends_at: probationEndsAt,
              stripe_payment_id: session.id,
            });

          if (error) {
            console.error("Legacy work order error:", error.message);
            throw error;
          }
        }
      }

      // =============================
      // 📧 EMAIL ADMIN (ALWAYS) - Fire and forget with timeout
      // =============================
      if (RESEND_KEY) {
        const emailPromise = fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + RESEND_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "STARZ-OS <steve@traffikboosters.com>",
            to: "admin@traffikboosters.com",
            subject: `Payment Received - ${businessName}`,
            html: `
              <h2>${businessName} paid</h2>
              <p>Amount: $${totalAmount.toFixed(2)}</p>
              <p>Package: ${pkg}</p>
              ${proposalId ? `<p>Proposal ID: ${proposalId}</p>` : ""}
              <p>Time: ${new Date().toISOString()}</p>
            `,
          }),
        });

        // Don't block response on email
        emailPromise.catch((err) => {
          console.error("Email send failed:", err);
        });

        // Optional: Add timeout
        setTimeout(() => {
          console.log("Email send timeout reached");
        }, 5000);
      }

      console.log("✅ Payment processed:", businessName);
    } else if (event.type === "payment_intent.succeeded") {
      // Skip - we handle this via checkout.session.completed
      console.log("⏭️ Skipping payment_intent.succeeded (handled by checkout)");
    }

    // =============================
    // 📝 MARK EVENT AS PROCESSED
    // =============================
    processedEvents.add(event.id);
    
    // Store in database for cross-instance idempotency
    await supabase.from("processed_webhook_events").insert({
      stripe_event_id: event.id,
      event_type: event.type,
      processed_at: new Date().toISOString(),
    }).catch((err) => {
      console.error("Failed to log processed event:", err);
      // Don't fail the webhook if logging fails
    });

    return new Response("ok", { status: 200 });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("❌ Webhook error:", msg);
    
    // Return 500 to trigger Stripe retry (except for specific cases)
    return new Response(`Webhook failed: ${msg}`, { 
      status: 500,
      headers: corsHeaders,
    });
  }
});