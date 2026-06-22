# Bench & Board

A simple web app that plans your lumber cuts and tells you exactly how many boards to buy before you head to the store. Built for home woodworkers and DIYers.

It does three things:

- **Cut & Buy** — list the pieces you need, and it packs them onto boards (accounting for blade kerf and end trim), then tells you how many to buy and shows a cut map for each board.
- **Inch calculator** — a workshop calculator that works in feet/inch fractions, with a keypad and a live answer.
- **Real Sizes** — a quick reference for nominal vs. actual lumber dimensions and fence pickets.

Everything runs in the browser. No accounts, no servers, nothing sent anywhere. Saved projects live in your browser on the device you used.

## Project structure

```
bench-and-board/
├── index.html              the page (structure only)
├── assets/
│   ├── styles.css          all the styling
│   └── app.js              all the logic
├── icons/                  app icons + favicon
├── manifest.webmanifest    lets phones "install" it to the home screen
├── _headers                Cloudflare caching rules
├── .gitignore
├── README.md               you are here
└── DEPLOY.md               step-by-step to put it online
```

## Run it on your computer

Double-click `index.html` and it opens in your browser. That's the whole thing, no setup, no build step, no command line.

## Put it online

See **DEPLOY.md**. The short version: it's a plain static site, so Cloudflare Pages hosts it for free and gives you a public link.

## About a database (Supabase, etc.)

There's no database yet, on purpose. The app has no need for one until you want people to log in and have their saved projects follow them across devices. When that day comes, the code is organized so a service like Supabase can be added without a rewrite. Until then, keeping it server-free means it's free to run, fast, and has nothing to break.

## Roadmap

See `../IDEAS.md` for the running list of improvements.

---
Version 0.7 (beta)
