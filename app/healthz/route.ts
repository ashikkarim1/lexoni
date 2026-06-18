export const dynamic = "force-dynamic";
export function GET() {
  return new Response("ok " + new Date().toISOString(), {
    headers: { "content-type": "text/plain" },
  });
}
