// @ts-nocheck
const testInsert = async () => {
  console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log(
    "KEY PREFIX:",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20)
  );

  const { data, error } = await supabase
    .schema("crm")
    .from("leads")
    .insert([
      {
        name: "Test User",
        email: "test@email.com",
      },
    ])
    .select();

  if (error) {
    console.error("FULL ERROR OBJECT:", error);

    console.error("STRINGIFIED:", JSON.stringify(error, null, 2));

    console.error("DETAILED:", {
      message: error?.message,
      code: (error as any)?.code,
      details: (error as any)?.details,
      hint: (error as any)?.hint,
      status: (error as any)?.status,
    });

    setStatus(`❌ ERROR: ${error?.message || "Unknown error"}`);
    return;
  }

  setStatus("✅ SUCCESS");
};