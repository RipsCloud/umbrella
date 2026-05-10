import { Hono } from "hono";

import { hashPassword, verifyPassword } from "../auth/password";
import type { Bindings, Variables } from "../env";

type SqlUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  password_hash: string | null;
  google_subject: string | null;
  is_active: number;
};

type WorkspaceClaim = {
  id: string;
  companyName: string;
  displayName: string;
  role: string;
};

type TokenPayload = {
  sub: string;
  email: string;
  given_name?: string;
  family_name?: string;
  name?: string;
  role?: string[];
  roles?: string;
  workspaces: string;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  jti: string;
};

type AuthResponse = {
  success: boolean;
  message?: string;
  token?: string;
  refreshToken?: string;
  expiresAt?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  workspaces?: WorkspaceClaim[];
  errors?: string[];
};

type GoogleTokenInfo = {
  sub: string;
  email: string;
  emailVerified: boolean;
  givenName: string;
  familyName: string;
  name: string;
  audience: string | null;
};

const LOCAL_DEBUG_SECRET = "ripscloud-local-debug-auth-secret-change-before-production";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.post("/api/auth/register", async (c) => {
  const body = asObject(await c.req.json().catch(() => null));
  const email = normalizeEmail(body.email);
  const password = valueToString(body.password);
  const firstName = valueToString(body.firstName ?? body.first_name) ?? "";
  const lastName = valueToString(body.lastName ?? body.last_name) ?? "";

  const errors = validateCredentials(email, password, true);
  if (errors.length) {
    return c.json<AuthResponse>({ success: false, message: "Registration failed", errors }, 400);
  }
  const passwordValue = password ?? "";

  const existing = await findUserByEmail(c.env.DB, email);
  if (existing) {
    return c.json<AuthResponse>(
      { success: false, message: "Registration failed", errors: ["Email is already registered"] },
      409,
    );
  }

  const now = Date.now();
  const user: SqlUser = {
    id: crypto.randomUUID(),
    email,
    first_name: firstName,
    last_name: lastName,
    password_hash: await hashPassword(passwordValue),
    google_subject: null,
    is_active: 1,
  };

  await c.env.DB.prepare(
    `INSERT INTO rips_admin_users
      (id, email, first_name, last_name, password_hash, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
  )
    .bind(user.id, user.email, user.first_name, user.last_name, user.password_hash, now, now)
    .run();

  return c.json(await issueAuthResponse(c.env, user, "Registration successful"));
});

app.post("/api/auth/login", async (c) => {
  const body = asObject(await c.req.json().catch(() => null));
  const email = normalizeEmail(body.email);
  const password = valueToString(body.password);

  const errors = validateCredentials(email, password, false);
  if (errors.length) {
    return c.json<AuthResponse>({ success: false, message: "Invalid email or password", errors }, 400);
  }

  const user = await findUserByEmail(c.env.DB, email);
  if (!user || user.is_active !== 1 || !user.password_hash) {
    return c.json<AuthResponse>({ success: false, message: "Invalid email or password" }, 401);
  }

  const valid = await verifyPassword(password ?? "", user.password_hash);
  if (!valid) return c.json<AuthResponse>({ success: false, message: "Invalid email or password" }, 401);

  return c.json(await issueAuthResponse(c.env, user, "Login successful"));
});

app.post("/api/auth/refresh", async (c) => {
  const body = asObject(await c.req.json().catch(() => null));
  const refreshToken = valueToString(body.refreshToken ?? body.refresh_token);
  if (!refreshToken) {
    return c.json<AuthResponse>({ success: false, message: "Invalid refresh token" }, 400);
  }

  const tokenHash = await sha256Hex(refreshToken);
  const row = await c.env.DB.prepare(
    `SELECT id, user_id, expires_at, revoked_at
     FROM rips_admin_refresh_tokens
     WHERE token_hash = ?
     LIMIT 1`,
  )
    .bind(tokenHash)
    .first<{ id: string; user_id: string; expires_at: number; revoked_at: number | null }>();

  if (!row || row.revoked_at || row.expires_at <= Date.now()) {
    return c.json<AuthResponse>({ success: false, message: "Refresh token is expired or revoked" }, 401);
  }

  const user = await findUserById(c.env.DB, row.user_id);
  if (!user || user.is_active !== 1) {
    return c.json<AuthResponse>({ success: false, message: "Invalid refresh token" }, 401);
  }

  const nextRefreshToken = generateOpaqueToken();
  const nextRefreshHash = await sha256Hex(nextRefreshToken);
  const now = Date.now();
  const refreshTtlMs = refreshTokenTtlSec(c.env) * 1000;

  await c.env.DB.batch([
    c.env.DB.prepare(
      `UPDATE rips_admin_refresh_tokens
       SET revoked_at = ?, replaced_by_token_hash = ?
       WHERE id = ?`,
    ).bind(now, nextRefreshHash, row.id),
    c.env.DB.prepare(
      `INSERT INTO rips_admin_refresh_tokens
        (id, user_id, token_hash, expires_at, revoked_at, replaced_by_token_hash, created_at)
       VALUES (?, ?, ?, ?, NULL, NULL, ?)`,
    ).bind(crypto.randomUUID(), user.id, nextRefreshHash, now + refreshTtlMs, now),
  ]);

  return c.json(await issueAuthResponse(c.env, user, "Token refreshed successfully", nextRefreshToken));
});

app.post("/api/auth/logout", async (c) => {
  const body = asObject(await c.req.json().catch(() => null));
  const refreshToken = valueToString(body.refreshToken ?? body.refresh_token);
  if (refreshToken) {
    const tokenHash = await sha256Hex(refreshToken);
    await c.env.DB.prepare(
      `UPDATE rips_admin_refresh_tokens
       SET revoked_at = ?
       WHERE token_hash = ? AND revoked_at IS NULL`,
    )
      .bind(Date.now(), tokenHash)
      .run();
  }
  return c.json({});
});

app.get("/api/auth/user", async (c) => {
  const auth = await authenticateRequest(c.env, c.req.raw);
  if (!auth) return c.json({ user: null }, 401);

  const workspaces = await loadWorkspaceClaims(c.env.DB, auth.user.id);
  return c.json({
    user: toUserResponse(auth.user),
    workspaces,
  });
});

app.post("/api/auth/google", async (c) => {
  const body = asObject(await c.req.json().catch(() => null));
  const token = valueToString(body.token);
  if (!token) {
    return c.json<AuthResponse>(
      { success: false, message: "Invalid Google token", errors: ["Google token is required"] },
      400,
    );
  }

  const google = await verifyGoogleToken(c.env, token);
  if (!google) {
    return c.json<AuthResponse>({ success: false, message: "Invalid Google token" }, 401);
  }

  let user = await findUserByGoogleSubject(c.env.DB, google.sub);
  if (!user) {
    user = await findUserByEmail(c.env.DB, google.email);
    if (!user) {
      return c.json<AuthResponse>(
        {
          success: false,
          message: "Google account is not linked to an existing user. Ask an administrator to add your account first.",
        },
        401,
      );
    }
    if (user.google_subject && user.google_subject !== google.sub) {
      return c.json<AuthResponse>(
        { success: false, message: "Google account is linked to a different identity." },
        401,
      );
    }
    user = await linkGoogleSubject(c.env.DB, user, google);
  }

  if (user.is_active !== 1) {
    return c.json<AuthResponse>({ success: false, message: "User account is disabled" }, 401);
  }

  return c.json(await issueAuthResponse(c.env, user, "Google login successful"));
});

async function issueAuthResponse(
  env: Bindings,
  user: SqlUser,
  message: string,
  providedRefreshToken?: string,
): Promise<AuthResponse> {
  const workspaces = await loadWorkspaceClaims(env.DB, user.id);
  const expiresAt = new Date(Date.now() + accessTokenTtlSec(env) * 1000);
  const token = await signAccessToken(env, user, workspaces, expiresAt);
  const refreshToken = providedRefreshToken ?? generateOpaqueToken();

  if (!providedRefreshToken) {
    await env.DB.prepare(
      `INSERT INTO rips_admin_refresh_tokens
        (id, user_id, token_hash, expires_at, revoked_at, replaced_by_token_hash, created_at)
       VALUES (?, ?, ?, ?, NULL, NULL, ?)`,
    )
      .bind(
        crypto.randomUUID(),
        user.id,
        await sha256Hex(refreshToken),
        Date.now() + refreshTokenTtlSec(env) * 1000,
        Date.now(),
      )
      .run();
  }

  return {
    success: true,
    message,
    token,
    refreshToken,
    expiresAt: expiresAt.toISOString(),
    user: toUserResponse(user),
    workspaces,
  };
}

async function signAccessToken(
  env: Bindings,
  user: SqlUser,
  workspaces: WorkspaceClaim[],
  expiresAt: Date,
): Promise<string> {
  const nowSec = Math.floor(Date.now() / 1000);
  const roles = Array.from(new Set(["User", ...workspaces.map((workspace) => workspace.role)]));
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    given_name: user.first_name || undefined,
    family_name: user.last_name || undefined,
    name: fullName || undefined,
    role: roles,
    roles: roles.join(","),
    workspaces: JSON.stringify(workspaces),
    iss: env.RIPS_ADMIN_AUTH_ISSUER,
    aud: env.RIPS_ADMIN_AUTH_AUDIENCE,
    exp: Math.floor(expiresAt.getTime() / 1000),
    iat: nowSec,
    jti: crypto.randomUUID(),
  };
  const header = { alg: "HS256", typ: "JWT" };
  const signingInput = `${base64UrlJson(header)}.${base64UrlJson(payload)}`;
  const signature = await hmacSha256(env, signingInput);
  return `${signingInput}.${signature}`;
}

async function authenticateRequest(env: Bindings, request: Request): Promise<{ user: SqlUser; payload: TokenPayload } | null> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length);
  const payload = await verifyAccessToken(env, token);
  if (!payload) return null;
  const user = await findUserById(env.DB, payload.sub);
  if (!user || user.is_active !== 1) return null;
  return { user, payload };
}

async function verifyAccessToken(env: Bindings, token: string): Promise<TokenPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const signingInput = `${parts[0]}.${parts[1]}`;
  const expected = await hmacSha256(env, signingInput);
  if (!constantTimeEqual(expected, parts[2] ?? "")) return null;

  const payload = JSON.parse(textDecoder.decode(base64UrlDecode(parts[1] ?? ""))) as TokenPayload;
  const nowSec = Math.floor(Date.now() / 1000);
  if (payload.exp <= nowSec) return null;
  if (payload.iss !== env.RIPS_ADMIN_AUTH_ISSUER) return null;
  if (payload.aud !== env.RIPS_ADMIN_AUTH_AUDIENCE) return null;
  return payload;
}

async function hmacSha256(env: Bindings, input: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(jwtSecret(env)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(input));
  return base64UrlEncode(new Uint8Array(signature));
}

function jwtSecret(env: Bindings): string {
  if (env.RIPS_ADMIN_JWT_SECRET) return env.RIPS_ADMIN_JWT_SECRET;
  if (env.LOG_LEVEL === "debug") return LOCAL_DEBUG_SECRET;
  throw new Error("RIPS_ADMIN_JWT_SECRET is required");
}

async function verifyGoogleToken(env: Bindings, token: string): Promise<GoogleTokenInfo | null> {
  const url = new URL("https://oauth2.googleapis.com/tokeninfo");
  url.searchParams.set("id_token", token);

  const response = await fetch(url.toString(), {
    headers: { accept: "application/json" },
  });
  if (!response.ok) return null;

  const body = asObject(await response.json().catch(() => null));
  const sub = valueToString(body.sub);
  const email = normalizeEmail(body.email);
  const audience = valueToString(body.aud);
  const configuredAudience = valueToString(env.RIPS_ADMIN_GOOGLE_CLIENT_ID);
  const emailVerified = body.email_verified === true || body.email_verified === "true";

  if (!sub || !email || !emailVerified) return null;
  if (configuredAudience && audience !== configuredAudience) return null;

  return {
    sub,
    email,
    emailVerified,
    givenName: valueToString(body.given_name) ?? "",
    familyName: valueToString(body.family_name) ?? "",
    name: valueToString(body.name) ?? "",
    audience,
  };
}

async function findUserByEmail(db: D1Database, email: string): Promise<SqlUser | null> {
  const row = await db
    .prepare(
      `SELECT id, email, first_name, last_name, password_hash, google_subject, is_active
       FROM rips_admin_users
       WHERE email = ?
       LIMIT 1`,
    )
    .bind(email)
    .first<SqlUser>();
  return row ?? null;
}

async function findUserById(db: D1Database, id: string): Promise<SqlUser | null> {
  const row = await db
    .prepare(
      `SELECT id, email, first_name, last_name, password_hash, google_subject, is_active
       FROM rips_admin_users
       WHERE id = ?
       LIMIT 1`,
    )
    .bind(id)
    .first<SqlUser>();
  return row ?? null;
}

async function findUserByGoogleSubject(db: D1Database, googleSubject: string): Promise<SqlUser | null> {
  const row = await db
    .prepare(
      `SELECT id, email, first_name, last_name, password_hash, google_subject, is_active
       FROM rips_admin_users
       WHERE google_subject = ?
       LIMIT 1`,
    )
    .bind(googleSubject)
    .first<SqlUser>();
  return row ?? null;
}

async function linkGoogleSubject(db: D1Database, user: SqlUser, google: GoogleTokenInfo): Promise<SqlUser> {
  const firstName = user.first_name || google.givenName;
  const lastName = user.last_name || google.familyName;
  await db.prepare(
    `UPDATE rips_admin_users
     SET google_subject = ?, first_name = ?, last_name = ?, updated_at = ?
     WHERE id = ?`,
  )
    .bind(google.sub, firstName, lastName, Date.now(), user.id)
    .run();

  return {
    ...user,
    google_subject: google.sub,
    first_name: firstName,
    last_name: lastName,
  };
}

async function loadWorkspaceClaims(db: D1Database, userId: string): Promise<WorkspaceClaim[]> {
  const rows = await db
    .prepare(
      `SELECT t.id, t.company_name, t.commercial_name, ut.role
       FROM rips_admin_user_tenants ut
       INNER JOIN rips_admin_tenants t ON t.id = ut.tenant_id
       WHERE ut.user_id = ? AND ut.is_active = 1 AND t.is_active = 1
       ORDER BY t.company_name ASC`,
    )
    .bind(userId)
    .all<{ id: string; company_name: string; commercial_name: string | null; role: string }>();

  return (rows.results ?? []).map((row) => ({
    id: row.id,
    companyName: row.company_name,
    displayName: row.commercial_name || row.company_name,
    role: row.role || "User",
  }));
}

function validateCredentials(email: string, password: string | null, registering: boolean): string[] {
  const errors: string[] = [];
  if (!email || !email.includes("@")) errors.push("A valid email is required");
  if (!password) errors.push("Password is required");
  if (registering && password && password.length < 6) errors.push("Password must be at least 6 characters");
  return errors;
}

function toUserResponse(user: SqlUser): AuthResponse["user"] {
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
  };
}

function generateOpaqueToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(64));
  return base64UrlEncode(bytes);
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function accessTokenTtlSec(env: Bindings): number {
  return boundedInt(env.RIPS_ADMIN_ACCESS_TOKEN_TTL_SEC, 3600, 60, 86_400);
}

function refreshTokenTtlSec(env: Bindings): number {
  return boundedInt(env.RIPS_ADMIN_REFRESH_TOKEN_TTL_SEC, 604_800, 3600, 2_592_000);
}

function boundedInt(value: string | undefined, fallback: number, min: number, max: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function valueToString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function base64UrlJson(value: unknown): string {
  return base64UrlEncode(textEncoder.encode(JSON.stringify(value)));
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function constantTimeEqual(a: string, b: string): boolean {
  return constantTimeBytesEqual(textEncoder.encode(a), textEncoder.encode(b));
}

function constantTimeBytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export default app;
