REVOKE SELECT ON public.shops FROM anon;
GRANT SELECT (id, name, slug, description, city, logo_url, is_active, created_at, updated_at) ON public.shops TO anon;