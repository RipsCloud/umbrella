import * as React from "react";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { LanguageToggle } from "@/components/language-toggle";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const [queryClient] = React.useState(() => new QueryClient());
  const { t } = useTranslation("common");

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <div className="flex min-h-screen flex-col">
          <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
            <div className="text-sm font-medium">{t("app.title")}</div>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
