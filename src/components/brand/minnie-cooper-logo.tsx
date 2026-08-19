import markA from "@/assets/minnie-cooper-mark-a.png.asset.json";

/** Icon-only mark: Minnie (black and white) beside Cooper (chestnut and white). */
export function MinnieCooperMark({ className = "h-10 w-auto" }: { className?: string }) {
  return (
    <img
      src={markA.url}
      alt="Minnie Cooper border collie mark"
      className={`shrink-0 object-contain ${className}`}
      loading="eager"
      decoding="async"
    />
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
