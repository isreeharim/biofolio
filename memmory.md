# Biofolio Project Memory

## Product Intent & V1 Loop

Biofolio is a free, no-code personal website builder. Its V1 loop is:

**Build → Customize → Publish → Share**

## V1 Backend & Database (Supabase)

- **Project Name**: `biofolio` (`zzdoibodjjltkbqrdlzn`)
- **Project URL**: `https://zzdoibodjjltkbqrdlzn.supabase.co`
- **Tables**:
  - `profiles`: User accounts, handles/usernames, avatar, bio, roles (`user`, `admin`), suspension status.
  - `portfolios`: Portfolio configurations, slug (`/:username`), template IDs, themes (palette, font, button), publication status.
  - `portfolio_sections`: Modular sections (`profile_header`, `links`, `projects`, `experience`, `education`, `socials`, `custom_text`) with drag & drop sorting.
  - `portfolio_items`: Individual items (projects with tags/images, links with icons, work history).
  - `analytics_events`: Privacy-friendly view & click logging with device & referrer attributes.
  - `content_reports`: User moderation & content reporting queue for admin oversight.
- **Storage Buckets**:
  - `avatars`: Profile pictures (public, 5MB).
  - `portfolio-media`: Project thumbnails, media & documents (public, 10MB).
- **Security**: Row Level Security (RLS) active on all tables with admin elevation and automated signup triggers.

## Current Files

- `index.html` — High-converting Landing Page with real-time handle reservation bar and Auth modals.
- `landing.css` / `landing.js` — Landing page styling and interactive handle checking logic.
- `builder.html` / `builder.js` — Creator Studio dashboard with live phone preview, drag & drop links, look & feel customizer, and cloud sync.
- `portfolio.html` / `portfolio.js` — Standalone public portfolio hydrated dynamically from Supabase with click analytics and moderation report modal.
- `admin.html` / `admin.css` / `admin.js` — Gated Admin Control Center with user management, portfolio moderation, content report queue, and destructive confirmation modals.
- `supabase.js` — Supabase client initialization, Auth, Portfolio CRUD, Analytics, Storage, and Admin APIs.
- `styles.css` / `extras.css` — Responsive design tokens, typography, themes, and public-page styling.

## Run Locally

```powershell
python -m http.server 4173 --bind 127.0.0.1
```
- Landing Page: `http://127.0.0.1:4173/index.html`
- Studio Builder: `http://127.0.0.1:4173/builder.html`
- Public Profile: `http://127.0.0.1:4173/portfolio.html?u=amelia`
- Admin Portal: `http://127.0.0.1:4173/admin.html`

