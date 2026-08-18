# Yogesh Bhardwaj — Portfolio

Live at: https://yogeshb15.github.io/portfolio/

## What's in this repo

- `index.html` — the entire site (structure, styling, content, and the 3D hero scene's logic)
- `three.min.js` — the Three.js rendering library the hero scene depends on. Must stay in the same folder as `index.html`, filename unchanged.

## One thing you need to add: `picture.jpg`

`index.html` references a file called `picture.jpg` in two places:

1. As the browser tab icon (favicon)
2. As the preview image shown when this link is shared on LinkedIn, WhatsApp, Twitter/X, Slack, etc. (Open Graph image)

That file isn't included here — add your own image, name it exactly `picture.jpg`, and place it in the same folder as `index.html` (repo root). A square-ish, reasonably high-resolution image works best for both use cases (1200×630px is the standard Open Graph size, but anything roughly square-to-landscape will render fine). Until you add it, the site works completely normally — you'll just get a blank tab icon and no preview image on shares.

## Requirements for the live URL to work

For this to publish at **yogeshb15.github.io/portfolio/** specifically, the GitHub repository itself must be named **exactly `portfolio`** (the URL path segment after `.github.io/` always matches the repo name for GitHub Pages project sites). If you're uploading into an existing repo that's already publishing to that URL, you're already set — just replace the files as described below.

## Deploying / updating

1. Repo must be named `portfolio` under your `yogeshb15` account.
2. Upload `index.html`, `three.min.js`, and your `picture.jpg` to the repo root — via "Add file → Upload files," drag all three in at once.
3. Commit.
4. In repo Settings → Pages, confirm the source is set to deploy from the branch/folder these files live in (usually `main`, root).
5. Wait 30 seconds to 2 minutes for GitHub Pages to rebuild.
6. Visit the live URL and hard-refresh (Ctrl+Shift+R / Cmd+Shift+R) to bypass browser cache.

## Contact form

The floating chat widget (bottom-right) sends messages to yogeshb00015@gmail.com via FormSubmit.co. The very first message anyone sends will trigger a one-time confirmation email — click the activation link in it before relying on the form. Send yourself a test message right after publishing.
