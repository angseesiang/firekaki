# Fire Kaki Deployment Notes

## Recommended Production Shape

- Host the public React app on Cloudflare Pages.
- Keep API secrets server-side. The homepage fire-news feed calls `/api/news/recent-fires`, which calls Exa from the API server with `EXA_API_KEY`.
- Host the Express API on a Node runtime with persistent outbound networking, such as Fly.io, Render, Railway, or Replit Deployments.
- Use managed Postgres for `DATABASE_URL`, such as Neon, Supabase, Railway Postgres, or Render Postgres.
- Keep large media on `media.firekaki.sg`, backed by Cloudflare R2 or the current object storage bucket.

## Cloudflare Pages

Build settings:

- Root directory: repository root
- Build command: `corepack enable && corepack pnpm install --frozen-lockfile && PORT=4173 BASE_PATH=/ corepack pnpm --filter @workspace/fire-kaki run build`
- Output directory: `artifacts/fire-kaki/dist/public`

Environment variables:

- `NODE_VERSION=24`
- `BASE_PATH=/`
- `PORT=4173`
- `VITE_API_BASE_URL=https://api.firekaki.sg`
- `VITE_GOOGLE_MAPS_API_KEY=<browser-restricted Google Maps key>`

The static app includes `artifacts/fire-kaki/public/_redirects` so deep links such as `/login`, `/signup`, and `/dashboard` resolve to the SPA entrypoint.

## API Runtime

Required environment variables:

- `PORT`
- `DATABASE_URL`
- `EXA_API_KEY`
- `GOOGLE_MAPS_API_KEY`

Optional environment variables:

- `EXA_NEWS_CACHE_TTL_MS` - defaults to 30 minutes.
- `RESEND_FROM_EMAIL` - only after the Resend domain is verified.

The API should be available at `https://api.firekaki.sg`. Configure CORS and cookies around the final production domain before accepting real sign-ins.
