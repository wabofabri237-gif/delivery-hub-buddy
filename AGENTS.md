<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

Use the generated full-resolution Shop Crew Hub logo for visible brand presentations and its derived text-free illustration for small navigation, favicon, and app-icon surfaces, because fine lettering and feature labels cannot remain legible at tiny sizes.

All authentication providers return through the public `/auth/callback` route, which verifies the stored session before sending users to a sanitized same-origin destination, so external OAuth and email confirmation never land directly on a protected page.

Public category navigation uses a shared category-to-legacy-label mapping and exact normalized label matching, never product-name guessing, so existing product categories remain readable without database rewrites.

Homepage and category listings reuse the same product card and existing catalog reads; popularity and promotions require actual supporting data, never inferred from stock or recency.
