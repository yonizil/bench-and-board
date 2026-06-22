/* Bench & Board — Google sign-in + cloud sync.
   When signed in, saved projects are stored in the cloud and pulled onto any
   device you sign in on. When signed out, the app works exactly as before,
   saving projects only on this device. Loaded after app.js, which exposes
   loadProjects(), saveProjects(), renderProjects(), showToast(). */
(function(){
  var token = null;       // Google ID token (kept in memory only)
  var clientId = null;
  var pulling = false;    // guard so a pull doesn't immediately re-push

  var rowEl = document.getElementById('authRow');
  var outEl = document.getElementById('authSignedout');
  var inEl = document.getElementById('authSignedin');
  var emailEl = document.getElementById('authEmail');

  function decodeJwt(t){
    try{
      var p = t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
      return JSON.parse(decodeURIComponent(escape(atob(p))));
    }catch(e){ return {}; }
  }

  function api(method, body){
    return fetch('/api/projects', {
      method: method,
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
  }

  // merge local + server project lists by id (newest savedAt wins), then sort
  function mergeProjects(localArr, serverArr){
    var byId = {};
    (serverArr || []).forEach(function(p){ if(p && p.id) byId[p.id] = p; });
    (localArr || []).forEach(function(p){
      if(!p || !p.id) return;
      var ex = byId[p.id];
      if(!ex || (p.savedAt || 0) > (ex.savedAt || 0)) byId[p.id] = p;
    });
    var out = Object.keys(byId).map(function(k){ return byId[k]; });
    out.sort(function(a,b){ return (b.savedAt || 0) - (a.savedAt || 0); });
    return out;
  }

  // push the current local projects up (called whenever projects change)
  window.onProjectsChanged = function(arr){
    if(!token || pulling) return;
    var projects = arr || loadProjects();
    api('POST', { projects: projects }).then(function(r){
      if(r.status === 401) handleExpired();
    }).catch(function(){ /* offline: will sync on the next change */ });
  };

  function pull(){
    pulling = true;
    api('GET').then(function(r){
      if(r.status === 401){ handleExpired(); return null; }
      return r.json();
    }).then(function(data){
      pulling = false;
      if(!data) return;
      var merged = mergeProjects(loadProjects(), data.projects || []);
      saveProjects(merged);      // local copy
      renderProjects();
      window.onProjectsChanged(merged); // make sure the server has the merged set
      showToast('Projects synced');
    }).catch(function(){
      pulling = false;
      showToast('Could not sync right now');
    });
  }

  function setSignedIn(t){
    token = t;
    var claims = decodeJwt(t);
    if(emailEl) emailEl.textContent = claims.email || 'your account';
    if(outEl) outEl.style.display = 'none';
    if(inEl) inEl.style.display = '';
    pull();
  }

  function setSignedOut(){
    token = null;
    if(inEl) inEl.style.display = 'none';
    if(outEl) outEl.style.display = '';
  }

  function handleExpired(){
    setSignedOut();
    showToast('Please sign in again to keep syncing');
    if(window.google && google.accounts && google.accounts.id) google.accounts.id.prompt();
  }

  var signOutBtn = document.getElementById('signOutBtn');
  if(signOutBtn) signOutBtn.addEventListener('click', function(){
    if(window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect();
    setSignedOut();
    showToast('Signed out — projects stay on this device');
  });

  function onCredential(resp){ if(resp && resp.credential) setSignedIn(resp.credential); }

  function initGIS(){
    if(!(window.google && google.accounts && google.accounts.id)){ setTimeout(initGIS, 300); return; }
    google.accounts.id.initialize({ client_id: clientId, callback: onCredential, auto_select: true });
    var btn = document.getElementById('gbtn');
    if(btn) google.accounts.id.renderButton(btn, { theme: 'outline', size: 'large', text: 'signin_with', shape: 'pill' });
    google.accounts.id.prompt(); // silently re-signs returning users
  }

  function hideAuthUI(){ if(rowEl) rowEl.style.display = 'none'; }

  // Only enable sign-in when the server provides a client id (i.e. on the live
  // site). Opening index.html directly from disk has no /api, so we hide it.
  fetch('/api/config').then(function(r){ return r.json(); }).then(function(c){
    if(c && c.googleClientId){ clientId = c.googleClientId; initGIS(); }
    else hideAuthUI();
  }).catch(hideAuthUI);
})();
