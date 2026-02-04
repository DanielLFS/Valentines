# Valentines

A cute, customizable Valentine "ask" page you can host and share as a link.

## Customize

Edit `config.js`:

- `pageTitle`, `badgeText`, `hintText`
- `images`: put your pictures in `assets/images/` and update the filenames
- `scenes`: change text + flow (add/remove scenes, change button routes)

### Add your images

Put files in `assets/images/` and reference them in `config.js`.

Recommended sizes: ~1200×800 (landscape) or 1080×1350 (portrait) works great.

## Preview locally

Simplest: open `index.html` in a browser.

If you want a local web server (helps with consistent behavior), use VS Code’s "Live Server" extension.

## Host as a link (GitHub Pages)

1. Push this repo to GitHub.
2. In your GitHub repo: **Settings → Pages**.
3. Under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **main** (or **master**) / **/(root)**
4. Wait ~1 minute.
5. Your link will look like:

`https://YOUR_GITHUB_USERNAME.github.io/Valentines/`

## Sending it

Keep it honest (no trick links):

"I made you a little Valentine page 🙂 Click this: <link>"

That’s it.
