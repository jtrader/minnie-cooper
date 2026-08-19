type MarkProps = {
  className?: string;
};

/** Minnie's half of the shield mark: the left (dark) side. Single color via currentColor. */
export function MinnieMark({ className = "h-8 w-auto" }: MarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 128 128"
      shapeRendering="geometricPrecision"
      className={`shrink-0 ${className}`}
      aria-label="Minnie mark"
    >
      <defs>
        <path
          id="mc-shield-minnie"
          d="M64 14 L106 26 C106 62 98 92 64 114 C30 92 22 62 22 26 Z"
        />
        <clipPath id="mc-clip-minnie">
          <rect x="0" y="0" width="64" height="128" />
        </clipPath>
      </defs>
      <g clipPath="url(#mc-clip-minnie)">
        <use href="#mc-shield-minnie" fill="currentColor" />
        <use
          href="#mc-shield-minnie"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/** Cooper's half of the shield mark: the right (chestnut) side. Single color via currentColor. */
export function CooperMark({ className = "h-8 w-auto" }: MarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 128 128"
      shapeRendering="geometricPrecision"
      className={`shrink-0 ${className}`}
      aria-label="Cooper mark"
    >
      <defs>
        <path
          id="mc-shield-cooper"
          d="M64 14 L106 26 C106 62 98 92 64 114 C30 92 22 62 22 26 Z"
        />
        <clipPath id="mc-clip-cooper">
          <rect x="64" y="0" width="64" height="128" />
        </clipPath>
      </defs>
      <g clipPath="url(#mc-clip-cooper)">
        <use href="#mc-shield-cooper" fill="currentColor" />
        <use
          href="#mc-shield-cooper"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
