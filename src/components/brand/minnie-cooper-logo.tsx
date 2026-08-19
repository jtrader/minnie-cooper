type CollieHeadProps = {
  className?: string;
  title?: string;
};

/**
 * A single stylised border-collie head in profile.
 * Coat colour comes from `currentColor`; the blaze/ruff uses the page background
 * so the mark stays legible in both the light and dark themes.
 */
function CollieHead({ className, title }: CollieHeadProps) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} role="img" aria-label={title}>
      {title ? <title>{title}</title> : null}
      <path
        d="M30 6 L52 30 C63 33 69 39 71 45 L92 48 L90 61 L69 63 C65 72 57 78 47 81 L36 96 L14 96 C10 74 12 44 24 30 Z"
        fill="currentColor"
      />
      <path
        d="M55 29 C63 38 67 48 68 60 L58 61 C57 50 53 40 47 33 Z"
        className="fill-background"
      />
      <circle cx="49" cy="43" r="3" className="fill-background" />
    </svg>
  );
}

/** Icon-only mark: Cooper (larger, chestnut) behind Minnie (smaller, ink). */
export function MinnieCooperMark({ className = "h-10 w-12" }: { className?: string }) {
  return (
    <span className={`relative inline-block shrink-0 ${className}`} aria-hidden="true">
      <CollieHead className="absolute right-0 top-0 h-full w-[80%] text-cooper" />
      <CollieHead className="absolute bottom-0 left-0 h-[72%] w-[58%] text-minnie" />
    </span>
  );
}

type LogoProps = {
  /** `full` shows the wordmark + descriptor, `compact` drops the descriptor. */
  variant?: "full" | "compact";
  className?: string;
};

export function MinnieCooperLogo({ variant = "full", className = "" }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <MinnieCooperMark />
      <div className="leading-none">
        <span className="block font-display text-xl font-bold tracking-tight text-foreground">
          Minnie Cooper
        </span>
        {variant === "full" ? (
          <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            Money Keeper Risk Management
          </span>
        ) : null}
      </div>
    </div>
  );
}
