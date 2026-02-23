import { cn } from './ui/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const sizeClasses = {
    sm: {
      container: 'w-6 h-6',
      text: 'text-base',
      tagline: 'text-[10px]',
    },
    md: {
      container: 'w-8 h-8',
      text: 'text-lg',
      tagline: 'text-xs',
    },
    lg: {
      container: 'w-12 h-12',
      text: 'text-2xl',
      tagline: 'text-sm',
    },
    xl: {
      container: 'w-16 h-16',
      text: 'text-3xl',
      tagline: 'text-base',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Logo Icon */}
      <div className={cn('relative', sizes.container)}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
            <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Outer Circle/Container */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="url(#logoGradient)"
          />

          {/* Inner highlight for depth */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="1"
          />

          {/* Stylized "C" representing container/capture */}
          <path
            d="M 68 32 A 22 22 0 1 1 68 68"
            stroke="white"
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
            opacity="0.95"
          />

          {/* Cursor/Click element */}
          <g filter="url(#glow)">
            <path
              d="M 33 44 L 33 64 L 40 57 L 45 66 L 49.5 64.5 L 44.5 55.5 L 52 55.5 Z"
              fill="white"
              opacity="0.95"
            />
          </g>

          {/* Sparkle accents for "capture" effect */}
          <circle cx="74" cy="26" r="3.5" fill="url(#accentGradient)" opacity="0.9" />
          <circle cx="77" cy="32" r="2" fill="url(#accentGradient)" opacity="0.7" />
          <circle cx="26" cy="74" r="2.5" fill="white" opacity="0.6" />
        </svg>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={cn('font-bold text-gray-900 leading-none', sizes.text)}>
            Capturely
          </span>
          <span className={cn('text-gray-500 leading-none mt-0.5', sizes.tagline)}>
            SMB Edition
          </span>
        </div>
      )}
    </div>
  );
}

// Simplified logo for favicons and small spaces
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="markGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="url(#markGradient)" />
      <path
        d="M 70 30 A 25 25 0 1 1 70 70"
        stroke="white"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 35 45 L 35 65 L 42 58 L 48 68 L 53 66 L 47 56 L 55 56 Z"
        fill="white"
      />
    </svg>
  );
}