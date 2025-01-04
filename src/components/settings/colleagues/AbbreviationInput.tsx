interface AbbreviationInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function AbbreviationInput({ value, onChange }: AbbreviationInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase().slice(0, 3);
    onChange(newValue);
  };

  return (
    <input
      type="text"
      maxLength={3}
      value={value}
      onChange={handleChange}
      className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
      placeholder="ABC"
      aria-label="Colleague abbreviation"
    />
  );
}