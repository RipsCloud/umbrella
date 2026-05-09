import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, type HealthResponse } from "@/lib/api";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { t } = useTranslation("common");
  const [health, setHealth] = React.useState<HealthResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function ping() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.health();
      setHealth(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-semibold">{t("app.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("app.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("home.status")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={ping} disabled={loading}>
            {t("home.ping")}
          </Button>
          {health && (
            <div className="text-sm text-muted-foreground">
              {t("home.pingSuccess")} — {health.module} @ {health.timestamp}
            </div>
          )}
          {error && (
            <div className="text-sm text-destructive">
              {t("home.pingError")}: {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
