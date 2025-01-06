import { memo } from 'react';

interface ColorGridProps {
  colors: string[];
  selectedColor: string;
  onChange: (color: string) => void;
}

export const ColorGrid = memo(function ColorGrid({ colors, selectedColor, onChange }: ColorGridProps) {
  return (
    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={`w-6 h-6 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            selectedColor === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''
          }`}
          style={{ backgroundColor: color }}
          aria-label={`Select color ${color}`}
          aria-pressed={selectedColor === color}
        />
      ))}
    </div>
  );
});