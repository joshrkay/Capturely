interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeConfig = {
  sm: { icon: 24, showText: false, fontSize: "text-base" },
  md: { icon: 32, showText: true, fontSize: "text-lg" },
  lg: { icon: 48, showText: true, fontSize: "text-2xl" },
} as const;

export function Logo({ size = "md", className = "" }: LogoProps) {
  const { icon, showText, fontSize } = sizeConfig[size];

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-indigo-600 dark:text-indigo-400"
        aria-hidden="true"
      >
        {/* Rounded square frame */}
        <rect
          x="4"
          y="4"
          width="40"
          height="40"
          rx="10"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
        />
        {/* Stylized "C" letterform */}
        <path
          d="M30 16a10 10 0 1 0 0 16"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        {/* Capture dot */}
        <circle cx="32" cy="24" r="2.5" fill="currentColor" />
      </svg>
      {showText && (
        <span
          className={`font-semibold ${fontSize} text-zinc-900 dark:text-zinc-50`}
        >
          Capturely
        </span>
      )}
    </span>
  );
}
