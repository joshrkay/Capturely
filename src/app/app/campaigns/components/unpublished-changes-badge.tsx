interface UnpublishedChangesBadgeProps {
  className?: string;
}

export function UnpublishedChangesBadge({ className = "" }: UnpublishedChangesBadgeProps) {
  return (
    <span className={`rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 ${className}`.trim()}>
      Unpublished changes
    </span>
  );
}
