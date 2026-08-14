# Biofolio project memory

## Product intent

Biofolio is a free, no-code personal website builder. Its V1 loop is:

Build → Customize → Publish → Share

The prototype focuses on a fast portfolio-building experience, not monetization.

## Current prototype

- `index.html` — creator dashboard with Build, Analytics, and Settings views.
- `styles.css` / `extras.css` — responsive visual system and public-page styles.
- `app.js` — base dashboard interactions: navigation, visual preview, theme controls, drag reordering, and publishing modal.
- `enhancements.js` — local browser persistence, profile editing, custom-link form, and live builder updates.
- `portfolio.html` / `portfolio.js` — standalone public portfolio page based on saved local profile data.

## Local state

Portfolio information is stored in the browser under the `biofolio-profile` localStorage key. It includes the user name, role, bio, visual options, and links.

## Run locally

From the project directory:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

- Builder: `http://127.0.0.1:4173/`
- Public profile: `http://127.0.0.1:4173/portfolio.html`

## Known scope boundary

This is a static front-end prototype. Production publishing, authentication, hosted usernames, real analytics, and a backend data store are not yet connected.
