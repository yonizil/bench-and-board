# Turning on accounts + cloud sync

This adds "Sign in with Google" so saved projects follow you across devices. The
database and all the code are already done. What's left are a few account steps,
and I'll co-drive each one with you. Here's the whole picture so nothing is a
surprise.

There are four steps. Three of them touch your accounts, which is why I can't
just do them silently.

---

## Step 1 — Create a Google sign-in key

This is the key that lets the "Sign in with Google" button work. It's free.

1. Go to https://console.cloud.google.com and sign in with your Google account.
2. Create a new project (top bar, "Select a project" → "New Project"). Name it
   "Bench and Board".
3. Open **APIs & Services → OAuth consent screen**. Choose **External**, fill in
   the app name ("Bench & Board") and your email where required, and save. Add
   your own email under **Test users** (or publish the app) so sign-in works.
4. Open **APIs & Services → Credentials → Create credentials → OAuth client ID**.
   - Application type: **Web application**
   - Under **Authorized JavaScript origins**, add your site address:
     `https://bench-and-board.pages.dev`
     (we'll add a custom domain here too, later, if you get one)
5. Click Create and **copy the Client ID** (a long string ending in
   `.apps.googleusercontent.com`).

I'll paste that Client ID into `wrangler.toml` for you.

---

## Step 2 — Put the project on GitHub

The server code (the `functions/` folder) only runs when the site is connected
to GitHub, so this is where we switch from drag-and-drop to automatic deploys.

1. Make a free account at https://github.com if you don't have one.
2. Create a new repository named `bench-and-board`.
3. Upload **everything inside the `bench-and-board` folder** (so `index.html`,
   `assets/`, `icons/`, `functions/`, `wrangler.toml`, and the rest sit at the
   top of the repo).

After this, every future change publishes automatically. No more manual uploads.

---

## Step 3 — Connect Cloudflare to GitHub

Your current live site was made by drag-and-drop, and Cloudflare can't convert
that kind into a GitHub-connected one. So we make a fresh Pages project linked to
GitHub. To keep the same `bench-and-board.pages.dev` address, we delete the old
drag-and-drop project first, then reuse the name.

1. In Cloudflare → **Workers & Pages**, delete the existing `bench-and-board`
   project (the drag-and-drop one).
2. **Create → Pages → Connect to Git**, pick the `bench-and-board` repo.
3. Build settings: **Framework preset: None**, **Build command: empty**,
   **Build output directory: `/`**. Deploy.

The database connection and the Google Client ID are already written into
`wrangler.toml`, so Cloudflare picks them up automatically. No clicking through
settings menus.

---

## Step 4 — Test it

1. Open `https://bench-and-board.pages.dev`.
2. On the Cut & Buy tab, in **My projects**, click **Sign in with Google**.
3. Build a cut list and save it.
4. Sign in with the same Google account on your phone, the project should appear.

---

## Good to know

- Signed out, the app works exactly as before: projects save only on that device.
- Signed in, projects sync to the cloud and merge with whatever was already on
  the device.
- The Google Client ID is not a secret, it's fine that it lives in the code.
- The database only ever stores your saved project lists, keyed to your Google
  account. Nothing else.
