import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const STRIPE_SECRET = Deno.env.get("STRIPE_SECRET_KEY")!;

Deno.serve(async (req) => {
  try {
    const { proposal_id, amount } = await req.json();

    // 🔥 Create Stripe Checkout Session via API (NO SDK)
    const stripeRes = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          "payment_method_types[]": "card",
          mode: "payment",
          "line_items[0][price_data][currency]": "usd",
          "line_items[0][price_data][product_data][name]": `Proposal ${proposal_id}`,
          "line_items[0][price_data][unit_amount]": String(amount * 100),
          "line_items[0][quantity]": "1",
          success_url: "https://yourdomain.com/success",
          cancel_url: "https://yourdomain.com/cancel",
        }),
      }
    );

    const session = await stripeRes.json();

    // 💾 Save session ID
    await supabase
      .from("proposals")
      .update({ stripe_session_id: session.id })
      .eq("proposal_id", proposal_id);

    return new Response(
      JSON.stringify({
        url: session.url,
        id: session.id,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : String(err);

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});