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
    <svg viewBox="0 0 48 40" fill="none" className={className} role="img" aria-label={title}>
      {title ? <title>{title}</title> : null}
      <path
        d="M6 39C4 30 4 20 9.5 13L7 2.5L16.5 9C21.5 6 27.5 6.5 32 10.5L46.5 19L31 24C28 31 22 36 15 39.5Z"
        fill="currentColor"
      />
      <path
        d="M14.5 10.5C18.5 15 22 21 24 28.5L18.5 29.5C16.5 22 13.5 16.5 10.5 12.5Z"
        className="fill-background"
      />
      <path d="M12 39.5C11 34 12.5 29 16 25.5L21 27.5C18 31.5 16 35 15.5 39.5Z" className="fill-background" />
      <circle cx="20.5" cy="16.5" r="1.6" className="fill-background" />
    </svg>
  );
}

/** Icon-only mark: Cooper (larger, chestnut) behind Minnie (smaller, ink). */
export function MinnieCooperMark({ className = "h-9 w-11" }: { className?: string }) {
  return (
    <span className={`relative inline-block shrink-0 ${className}`} aria-hidden="true">
      <CollieHead className="absolute right-0 top-0 h-full w-[78%] text-cooper" />
      <CollieHead className="absolute bottom-0 left-0 h-[76%] w-[62%] text-minnie" />
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
