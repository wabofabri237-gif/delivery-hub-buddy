# Nboashop le marché prêt de chez vous

Je  veux créer un dising pour un marketplace espace client espace administrateur espace livreur

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://delivery-hub-buddy.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/db5e9ef2-f272-4645-8ef9-4b0efd442b13).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

## Deployment on Vercel

Shop Crew Hub is a TanStack Start web application, not a Next.js project.
Do not install Next.js to satisfy a framework-detection error.

- Import the connected repository into Vercel with the repository root as the Root Directory.
- Use Framework Preset **Other**. The checked-in `vercel.json` disables Next.js detection.
- Use the existing `npm run build` command. Clear any Output Directory override: Nitro generates the full Vercel deployment at `.vercel/output`, including server functions.
- Vercel sets `VERCEL=1`; this selects the Vercel target while leaving ordinary Lovable builds unchanged.
- Configure the application's public environment variables and required server secrets in Vercel without committing them to Git. Lovable-managed services are not automatically transferred to another host.
- Before switching users to a Vercel domain, allow its exact public `/auth/callback` address in the existing authentication service and verify sign-in and agent consent on that domain.
- After repository sync, redeploy from Vercel and check the home page, sign-in, catalogue, server functions, and `/sw.js`. A successful local preview does not verify a Vercel deployment.

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
