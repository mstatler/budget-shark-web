// app/api/waitlist/route.ts

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") || "";
  let email: string | null = null;

  try {
    if (contentType.includes("application/json")) {
      const body = await req.json();
      email = body?.email ?? null;
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      email = (formData.get("email") as string) ?? null;
    }

    if (!email) {
      return new Response(
        JSON.stringify({ ok: false, error: "Email required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ Add your saving or logging logic here
    // Example: await saveEmailToDatabase(email);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Waitlist error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
