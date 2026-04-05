import Stripe from "npm:stripe@14.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

Deno.serve(async (req: Request) => {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" as any });
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("missing signature", { status: 400 });
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, Deno.env.get("STRIPE_WEBHOOK_SECRET")!);
  } catch (e) {
    return new Response(`signature error: ${(e as Error).message}`, { status: 400 });
  }
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const RESEND_KEY = Deno.env.get("RESEND_API_KEY")!;

  // === SUBSCRIPTION EVENTS (existing logic) ===
  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created" || event.type === "customer.subscription.deleted") {
    const sub = event.data.object as any;
    const { data: tenant } = await supabase.from("tenants").select("id").eq("stripe_customer_id", sub.customer).single();
    const tenant_id = tenant?.id ?? null;
    if (event.type === "customer.subscription.deleted") {
      await supabase.from("billing.subscriptions").update({ status: "canceled" }).eq("stripe_subscription_id", sub.id);
      return new Response("ok");
    }
    await supabase.from("billing.subscriptions").upsert({ tenant_id, stripe_subscription_id: sub.id, stripe_customer_id: sub.customer, plan_id: sub.items?.data?.[0]?.price?.id ?? null, status: sub.status, current_period_end: new Date(sub.current_period_end * 1000) }, { onConflict: "tenant_id" });
  }

  // === PAYMENT EVENTS (new - creates work orders) ===
  if (event.type === "payment_intent.succeeded" || event.type === "checkout.session.completed") {
    try {
      const obj = event.data.object as any;
      const metadata = obj.metadata || {};
      const customerEmail = obj.customer_email || obj.receipt_email || metadata.email || null;
      const businessName = metadata.business_name || metadata.company || customerEmail || "New Client";
      const industry = metadata.industry || "digital marketing";
      const phone = metadata.phone || null;
      const pkg = metadata.package || "Digital Marketing Package";
      const amountPaid = obj.amount_received || obj.amount_total || 0;
      const totalAmount = metadata.total_amount ? parseInt(metadata.total_amount) : Math.round(amountPaid / 100);
      const probationEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

      // Create work order in probation status
      const { data: wo, error: woErr } = await supabase.schema("deals").from("work_orders").insert({
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
        stripe_payment_id: obj.id,
      }).select().single();

      if (woErr) { console.error("Work order error:", woErr.message); }

      // Update lead if lead_id in metadata
      if (metadata.lead_id) {
        await supabase.from("leads").update({ status: "Paid", updated_at: new Date().toISOString() }).eq("id", metadata.lead_id);
      }

      // Email Rico
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: "Bearer "+RESEND_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "STARZ-OS <steve@traffikboosters.com>",
          to: "admin@traffikboosters.com",
          subject: "Payment Received - Work Order Created: "+businessName,
          html: "<h2>New Work Order - PROBATION</h2><p><strong>"+businessName+"</strong> has paid.</p><p><strong>Package:</strong> "+pkg+"</p><p><strong>Amount:</strong> $"+totalAmount+"</p><p><strong>Email:</strong> "+(customerEmail||"N/A")+"</p><p><strong>Phone:</strong> "+(phone||"N/A")+"</p><p style=color:red><strong>DO NOT begin fulfillment until probation clears: "+new Date(probationEndsAt).toLocaleDateString()+"</strong></p>",
        }),
      });

      // Email client welcome
      if (customerEmail) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: "Bearer "+RESEND_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Steve Williams <steve@traffikboosters.com>",
            to: customerEmail,
            subject: "Welcome to Traffik Boosters - Your order is confirmed",
            html: "<h2>Welcome to Traffik Boosters!</h2><p>Hi "+businessName+",</p><p>Your payment has been received and your account is being set up.</p><p><strong>Package:</strong> "+pkg+"</p><p><strong>Amount paid:</strong> $"+totalAmount+"</p><p>Your dedicated team will reach out within 24 hours to begin onboarding.</p><p>You have a 3-day satisfaction guarantee. Contact us within 3 days for a full refund if not satisfied.</p><br/><p>Steve Williams<br/>786-254-1592<br/>steve@traffikboosters.com</p>",
          }),
        });
      }

      console.log("Work order created:", wo?.id, "for", businessName, "probation until", probationEndsAt);
    } catch(err: any) {
      console.error("Payment processing error:", err.message);
    }
  }

  return new Response("ok");
});