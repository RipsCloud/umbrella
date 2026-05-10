import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { cors } from "hono/cors";

import { TenantDO } from "./do/tenant-do";
import authRoutes from "./routes/auth";
import ripsAdminRoutes from "./routes/rips-admin";
import tenantRoutes from "./routes/tenant";
import type { Bindings, Variables } from "./env";

export { TenantDO };

const app = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>();

app.use("*", async (c, next) => {
  const origins = c.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
  return cors({ origin: origins })(c, next);
});

app.get("/health", (c) =>
  c.json({
    status: "ok",
    module: "ripscloud",
    upstream: c.env.FEVRIPS_UPSTREAM_BASE_URL,
    timestamp: new Date().toISOString(),
  }),
);

app.route("/", authRoutes);
app.route("/", ripsAdminRoutes);
app.route("/", tenantRoutes);

app.doc("/doc", {
  openapi: "3.1.0",
  info: {
    title: "Rips Cloud API",
    version: "0.0.0",
    description:
      "Per-tenant manager over the Colombian Ministry FEV RIPS / SISPRO upstream. Routes are namespaced by tenant slug: POST /{tenant}/api/Auth/LoginSISPRO, POST /{tenant}/api/ConsultasFevRips/RecuperarCUV, etc. Login is intercepted to store credentials + token in a per-tenant Durable Object; subsequent calls auto-inject the token and refresh on 401.",
  },
  servers: [
    { url: "https://ripscloud-api.pahventure.workers.dev", description: "Production Workers.dev fallback" },
    { url: "https://api.ripscloud.com", description: "Planned custom production domain" },
    { url: "https://api-stage.ripscloud.com", description: "Stage" },
    { url: "http://localhost:8830", description: "Local development" },
  ],
});

app.get("/swagger", swaggerUI({ url: "/doc" }));
app.get("/", (c) => c.json({ name: "Rips Cloud API", status: "ok" }));

export default app;
