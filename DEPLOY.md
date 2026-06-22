# Putting Bench & Board online

This app is a plain static website (just HTML, CSS, JS), so hosting it is simple and free. You do not need a database, a server, or any command-line tools.

There are two ways to deploy. Pick one:

- **Option A — GitHub + Cloudflare (recommended).** A bit more setup the first time, but after that every change you make goes live automatically. This is the professional way.
- **Option B — Drag-and-drop.** Live in about 5 minutes. Good for trying it out, but you re-upload by hand every time you change something.

Both use **Cloudflare Pages**, which is free.

---

## Before you start

You'll deploy the **contents of the `bench-and-board` folder**, the one with `index.html` inside it. That `index.html` needs to sit at the top level of whatever you upload, so the site opens straight to the app.

---

## Option A — GitHub + Cloudflare (recommended)

### 1. Make a GitHub account
Go to https://github.com and sign up (free). GitHub is just a place your code lives online.

### 2. Create a repository
- Click the **+** in the top right, then **New repository**.
- Name it `bench-and-board`.
- Leave it **Public** (or Private, either works).
- Click **Create repository**.

### 3. Upload the files
- On the new repo page, click **uploading an existing file** (the link in the middle).
- Open your `bench-and-board` folder on your computer, select **everything inside it** (index.html, the assets folder, the icons folder, manifest, etc.), and drag it all into the browser.
- Important: drag the files and folders that are *inside* `bench-and-board`, so `index.html` ends up at the top of the repo (not inside another folder).
- Scroll down, click **Commit changes**.

### 4. Connect Cloudflare Pages
- Go to https://dash.cloudflare.com and sign up (free).
- In the left menu, open **Workers & Pages**.
- Click **Create**, choose the **Pages** tab, then **Connect to Git**.
- Authorize GitHub, then pick your `bench-and-board` repository.

### 5. Build settings
When it asks how to build:
- **Framework preset:** None
- **Build command:** leave it empty
- **Build output directory:** `/` (just a slash, meaning the top level)

Click **Save and Deploy**.

### 6. You're live
After a minute you'll get a link like `bench-and-board.pages.dev`. That's your app, share it with anyone.

### Making changes later
Edit a file on GitHub (or upload a new version of it), commit, and Cloudflare automatically rebuilds and updates the live site within a minute. You never touch Cloudflare again.

---

## Option B — Drag-and-drop (fastest)

### 1. Cloudflare account
Sign up at https://dash.cloudflare.com (free).

### 2. Create the project
- Left menu, **Workers & Pages**.
- Click **Create**, choose the **Pages** tab, then **Upload assets**.
- Give it a name like `bench-and-board`.

### 3. Upload
- Drag your `bench-and-board` folder onto the upload area (or click to browse and select it).
- Click **Deploy site**.

### 4. You're live
You'll get a `*.pages.dev` link.

> If the link shows a list of files instead of the app, it means `index.html` wasn't at the top of what you uploaded. Re-deploy, and this time open the `bench-and-board` folder first and drag the files **inside** it (not the folder itself).

### Making changes later
Go back into the project, choose **Create deployment**, and drag the updated folder again.

---

## Optional: use your own domain

Once it's live on a `.pages.dev` link, you can point a custom domain (like `benchandboard.com`) at it:
- Buy a domain (Cloudflare itself sells them, or any registrar).
- In your Pages project, open **Custom domains**, click **Set up a domain**, and follow the steps.

---

## Later: accounts and cloud sync (Supabase)

Not needed yet, and intentionally left out. The moment you want users to log in and have their saved projects sync across devices, that's when Supabase earns its place. It would add:
- a login screen,
- a database table for saved projects,
- security rules so people only see their own projects.

When you're ready, that's a focused next project. For now the app saves projects in the browser, which keeps everything free and simple.
