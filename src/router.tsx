import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// After a new deploy, old page chunks disappear: reload once to fetch the fresh version.
if (typeof window !== "undefined") {
  const reloadOnce = () => {
    const key = "chunk-reload-at";
    const last = Number(sessionStorage.getItem(key) ?? 0);
    if (Date.now() - last > 10_000) {
      sessionStorage.setItem(key, String(Date.now()));
      window.location.reload();
    }
  };
  window.addEventListener("vite:preloadError", (e) => {
    e.preventDefault();
    reloadOnce();
  });
  window.addEventListener("unhandledrejection", (e) => {
    const msg = String((e.reason as Error | undefined)?.message ?? e.reason ?? "");
    if (/dynamically imported module|Importing a module script failed/i.test(msg)) reloadOnce();
  });
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
