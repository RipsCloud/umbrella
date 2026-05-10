import { APP_VERSION } from '@/lib/version'

/**
 * Small always-visible version badge shown at the bottom-right of every page
 * (including auth screens). The value is baked in at build time by Vite via
 * the VITE_APP_VERSION env var, so clients can quote it when reporting issues.
 */
export function VersionBadge() {
  return (
    <div
      className="pointer-events-none fixed bottom-1 right-2 z-50 select-none font-mono text-[10px] leading-none text-muted-foreground/70"
      aria-label="application version"
      title={`Build ${APP_VERSION}`}
    >
      {APP_VERSION}
    </div>
  )
}
