export async function GET() {
  // Some browser extensions probe /session on the current origin and expect 200.
  // Respond with a minimal JSON to avoid noisy 401 errors in the console.
  return Response.json({ ok: true }, { status: 200 });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}

