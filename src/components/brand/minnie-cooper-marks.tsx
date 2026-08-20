import minnieIcon from "@/assets/minnie-icon.png.asset.json";
import cooperIcon from "@/assets/cooper-icon.png.asset.json";

type MarkProps = {
  className?: string;
};

/** Minnie: full border collie head mark (black). */
export function MinnieMark({ className = "h-8 w-auto" }: MarkProps) {
  return (
    <img
      src={minnieIcon.url}
      alt="Minnie mark"
      loading="lazy"
      className={`shrink-0 object-contain ${className}`}
    />
  );
}

/** Cooper: full border collie head mark (chestnut). */
export function CooperMark({ className = "h-8 w-auto" }: MarkProps) {
  return (
    <img
      src={cooperIcon.url}
      alt="Cooper mark"
      loading="lazy"
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
