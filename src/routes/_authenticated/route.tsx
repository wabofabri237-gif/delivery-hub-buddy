import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      const next = `${window.location.pathname}${window.location.search}`;
      throw redirect({ to: "/auth", search: { next } });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
