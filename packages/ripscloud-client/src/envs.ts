// Upstream FEV RIPS / SISPRO base URLs. Names keep the FEVRIPS_ prefix
// because that's what the upstream service is actually called — the brand
// rename to "ripscloud" is for THIS codebase, not for the Colombian
// Ministry's product.
//
// TODO (from MD-114 / RC-2 comment 3): confirm `prod` URL before go-live.
export const FEVRIPS_ENVIRONMENTS = {
  stage: "https://rips-stage.matrixmdsoftware.com",
  prod: "https://rips.matrixmdsoftware.com",
} as const;

export type FevRipsEnv = keyof typeof FEVRIPS_ENVIRONMENTS;
