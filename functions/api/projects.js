// Pages Function: /api/projects
// Stores and returns the signed-in user's saved projects in the D1 database.
// Auth: the browser sends a Google ID token as "Authorization: Bearer <token>".
// We verify it with Google, then key the data on the user's stable Google id.

function json(obj, status){
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

// Verify the Google ID token using Google's tokeninfo endpoint.
// Returns { sub, email } when valid, or null.
async function verifyUser(request, env){
  const auth = request.headers.get("Authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/);
  if(!m) return null;
  let info;
  try{
    const res = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(m[1]));
    if(!res.ok) return null;
    info = await res.json();
  }catch(e){ return null; }
  // tokeninfo already checks signature and expiry; we confirm the audience is our app.
  if(env.GOOGLE_CLIENT_ID && info.aud !== env.GOOGLE_CLIENT_ID) return null;
  if(!info.sub) return null;
  return { sub: info.sub, email: info.email || "" };
}

// GET /api/projects  -> { projects: [...], updated_at: number }
export async function onRequestGet(context){
  const { request, env } = context;
  const user = await verifyUser(request, env);
  if(!user) return json({ error: "unauthorized" }, 401);
  const row = await env.DB
    .prepare("SELECT projects, updated_at FROM user_projects WHERE user_sub = ?")
    .bind(user.sub).first();
  let projects = [];
  if(row && row.projects){ try{ projects = JSON.parse(row.projects); }catch(e){ projects = []; } }
  return json({ projects: projects, updated_at: row ? row.updated_at : 0 });
}

// POST /api/projects  body: { projects: [...] }  -> { ok:true, updated_at }
export async function onRequestPost(context){
  const { request, env } = context;
  const user = await verifyUser(request, env);
  if(!user) return json({ error: "unauthorized" }, 401);
  let body;
  try{ body = await request.json(); }catch(e){ return json({ error: "bad json" }, 400); }
  const projects = Array.isArray(body.projects) ? body.projects : [];
  const text = JSON.stringify(projects);
  if(text.length > 300000) return json({ error: "too many projects" }, 413); // ~300 KB guard
  const now = Date.now();
  await env.DB.prepare(
    "INSERT INTO user_projects (user_sub, email, projects, updated_at) VALUES (?, ?, ?, ?) " +
    "ON CONFLICT(user_sub) DO UPDATE SET projects = excluded.projects, email = excluded.email, updated_at = excluded.updated_at"
  ).bind(user.sub, user.email, text, now).run();
  return json({ ok: true, updated_at: now });
}
