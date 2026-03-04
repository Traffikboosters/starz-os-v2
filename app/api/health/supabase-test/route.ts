import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from("af_rules")
    .select("*")
    .limit(1);

  if (error) {
    return Response.json({ connected: false, error });
  }

  return Response.json({
    connected: true,
    sample: data,
  });
}