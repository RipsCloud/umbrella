// Build-time application version. Format: vYYYY.MM.DD.HH (UTC).
// Injected by the Makefile via VITE_APP_VERSION, which Vite inlines at build.
// Falls back to "dev" when running outside a tagged build (e.g. raw `vite dev`).
export const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? 'dev'
