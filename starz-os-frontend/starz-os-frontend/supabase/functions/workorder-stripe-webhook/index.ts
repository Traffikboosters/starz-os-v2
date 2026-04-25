import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.46.1";
import Stripe from "npm:stripe@14.21.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });
const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const RESEND_KEY = Deno.env.get("RESEND_API_KEY")!;

serve(async (req) => {
  const sb = createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  } catch(err: any) {
    console.error("Webhook signature failed:", err.message);
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
  }

  if (event.type === "payment_intent.succeeded" || event.type === "checkout.session.completed") {
    try {
      const obj = event.data.object as any;
      const metadata = obj.metadata || {};
      const customerEmail = obj.customer_email || obj.receipt_email || metadata.email || null;
      const businessName = metadata.business_name || metadata.company || customerEmail || "New Client";
      const industry = metadata.industry || "Digital Marketing";
      const phone = metadata.phone || null;
      const pkg = metadata.package || "Digital Marketing Package";
      const amountPaid = obj.amount_received || obj.amount_total || 0;
      const totalAmount = metadata.total_amount ? parseInt(metadata.total_amount) : Math.round(amountPaid / 100);
      const probationEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

      // Create work order with probation status
      const { data: wo, error: woErr } = await sb.schema("deals").from("work_orders").insert({
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
        probation_ends_at: probationEndsAt,
        stripe_payment_id: obj.id,
      }).select().single();

      if (woErr) {
        console.error("Work order creation failed:", woErr.message);
        return new Response(JSON.stringify({ error: woErr.message }), { status: 500 });
      }

      // Update lead status if lead_id in metadata
      if (metadata.lead_id) {
        await sb.from("leads").update({
          status: "Paid",
          updated_at: new Date().toISOString(),
        }).eq("id", metadata.lead_id);
      }

      // Notify Rico
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: "Bearer "+RESEND_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "STARZ-OS <steve@traffikboosters.com>",
          to: "admin@traffikboosters.com",
          subject: "Payment Received - Work Order Created: "+businessName,
          html: "<h2>New Work Order Created</h2><p><strong>"+businessName+"</strong> has paid and a work order has been created.</p><p><strong>Package:</strong> "+pkg+"</p><p><strong>Amount:</strong> $"+totalAmount+"</p><p><strong>Email:</strong> "+(customerEmail||"N/A")+"</p><p><strong>Phone:</strong> "+(phone||"N/A")+"</p><p><strong>Status:</strong> PROBATION (3-day cancellation window)</p><p><strong>Probation ends:</strong> "+probationEndsAt+"</p><p><em>Do NOT begin fulfillment until probation clears on "+new Date(probationEndsAt).toLocaleDateString()+"</em></p>",
        }),
      });

      // Notify client
      if (customerEmail) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: "Bearer "+RESEND_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Steve Williams <steve@traffikboosters.com>",
            to: customerEmail,
            subject: "Welcome to Traffik Boosters - Your order is confirmed",
            html: "<h2>Welcome to Traffik Boosters!</h2><p>Hi "+businessName+",</p><p>Your payment has been received and your account is being set up.</p><p><strong>Package:</strong> "+pkg+"</p><p><strong>Amount paid:</strong> $"+totalAmount+"</p><p>Your dedicated team will reach out within 24 hours to begin onboarding.</p><p>You have a 3-day satisfaction guarantee. If you are not happy for any reason, contact us within 3 days for a full refund.</p><br/><p>Steve Williams<br/>786-254-1592<br/>steve@traffikboosters.com</p>",
          }),
        });
      }

      console.log("Work order created:", wo?.id, "for", businessName);
      return new Response(JSON.stringify({ success: true, work_order_id: wo?.id, business: businessName, probation_ends: probationEndsAt }), { status: 200 });

    } catch(err: any) {
      console.error("Payment processing error:", err.message);
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});