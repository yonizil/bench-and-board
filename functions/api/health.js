// Lightweight health check for the System status panel.
// Confirms the Pages Function runs and that the D1 database answers a trivial query.
export async function onRequest(context) {
  const { env } = context;
  let db = false;
  try {
    if (env.DB) {
      await env.DB.prepare('SELECT 1').first();
      db = true;
    }
  } catch (e) {
    db = false;
  }
  return new Response(JSON.stringify({ ok: true, db, ts: Date.now() }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
  });
}
