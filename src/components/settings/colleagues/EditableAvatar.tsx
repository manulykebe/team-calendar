import { useState, useRef, useEffect } from "react";
import { ColleagueAvatar } from "./ColleagueAvatar";

interface EditableAvatarProps {
  firstName: string;
  lastName: string;
  color: string;
  abbreviation?: string;
  size?: "sm" | "md" | "lg";
  onInitialsChange: (initials: string) => void;
}

export function EditableAvatar({
  firstName,
  lastName,
  color,
  abbreviation,
  size = "md",
  onInitialsChange,
}: EditableAvatarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(abbreviation || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (value !== abbreviation) {
      onInitialsChange(value.toUpperCase().slice(0, 3));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setValue(abbreviation || "");
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div
        className={`relative inline-block ${
          size === "sm" ? "w-8 h-8" : size === "md" ? "w-10 h-10" : "w-12 h-12"
        }`}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase().slice(0, 3))}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="absolute inset-0 w-full h-full text-center rounded-full border-2 border-blue-500 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          maxLength={3}
          style={{
            fontSize: size === "sm" ? "12px" : size === "md" ? "14px" : "16px",
          }}
        />
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer hover:opacity-80 transition-opacity"
      role="button"
      aria-label="Edit initials"
      title="Click to edit initials"
    >
      <ColleagueAvatar
        firstName={firstName}
        lastName={lastName}
        color={color}
        abbreviation={abbreviation}
        size={size}
      />
    </div>
  );
}
