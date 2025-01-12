interface ColorPickerProps {
  colors: string[];
  selectedColor: string;
  onChange: (color: string) => void;
}

export function ColorPicker({
  colors,
  selectedColor,
  onChange,
}: ColorPickerProps) {
  return (
    <div className="flex items-center space-x-2">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={`w-6 h-6 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            selectedColor === color ? "ring-2 ring-offset-2 ring-blue-500" : ""
          }`}
          style={{ backgroundColor: color }}
          aria-label={`Select color ${color}`}
          aria-pressed={selectedColor === color}
        />
      ))}
    </div>
  );
}
