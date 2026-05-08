export type { paths, components } from "./generated/schema";

export type { Logger } from "./types/logger";
export { noopLogger } from "./types/logger";
export type { CredentialsProvider, SisproCredentials } from "./types/credentials";
export { staticCredentials } from "./types/credentials";
export type { TokenStore } from "./types/token-store";
export {
  FevRipsError,
  FevRipsAuthError,
  FevRipsValidationError,
  FevRipsUpstreamError,
  FevRipsNetworkError,
} from "./types/errors";

export { FEVRIPS_ENVIRONMENTS, type FevRipsEnv } from "./envs";

export { createInMemoryTokenStore } from "./stores/memory";
export { createKvTokenStore, type KVLike } from "./stores/kv";

export { createFevRipsClient, type FevRipsClient, type FevRipsClientOptions } from "./client";
export { createAuthenticatedFetch, type AuthenticatedFetchOptions } from "./authenticated-fetch";
