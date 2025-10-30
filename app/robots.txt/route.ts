// app/robots.txt/route.ts

export const runtime = "edge"; // optional, but keeps it tiny

export async function GET() {
  const body = [
    "User-agent: *",
    "Allow: /",
    "Sitemap: https://thebudgetshark.com/sitemap.xml",
  ].join("\n");

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
