// Pages Function: /api/config
// Hands the public Google client id to the front-end so we only set it in one
// place (wrangler.toml). Safe to expose; the client id is not a secret.

export async function onRequestGet(context){
  return new Response(
    JSON.stringify({ googleClientId: context.env.GOOGLE_CLIENT_ID || null }),
    { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
  );
}
