interface ColleagueAvatarProps {
  firstName: string;
  lastName: string;
  color: string;
  abbreviation?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

export function ColleagueAvatar({
  firstName,
  lastName,
  color,
  abbreviation,
  size = "md",
}: ColleagueAvatarProps) {
  const initials = abbreviation || `${firstName[0]}${lastName[0]}`;
  const sizeClasses = sizes[size];

  return (
    <div
      className={`${sizeClasses} rounded-full flex items-center justify-center text-white font-medium`}
      style={{ backgroundColor: color }}
      role="img"
      aria-label={`${firstName} ${lastName}'s avatar`}
      data-tsx-id="colleague-avatar"
    >
      {initials.toUpperCase()}
    </div>
  );
}
