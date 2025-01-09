import { useState } from "react";
import { Clock } from "lucide-react";
import { User } from "../../types/user";
import { AvailabilityModal } from "./availability/AvailabilityModal";

interface AvailabilitySettingsProps {
  currentUser: User | null;
  colleagues: User[];
}

export function AvailabilitySettings({ currentUser, colleagues }: AvailabilitySettingsProps) {
  const [selectedColleague, setSelectedColleague] = useState<User | null>(null);
  const isAdmin = currentUser?.role === "admin";

  if (!isAdmin) return null;

  const handleSetAvailability = () => {
    if (selectedColleague) {
      setSelectedColleague(selectedColleague); // This triggers the modal
    }
  };

  return (
    <div className="border-t pt-6">
      <h3 className="text-sm font-medium text-zinc-900 mb-2">Availability Management</h3>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <select
            value={selectedColleague?.id || ""}
            onChange={(e) => {
              const colleague = colleagues.find(c => c.id === e.target.value);
              setSelectedColleague(colleague || null);
            }}
            className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Select a colleague</option>
            {colleagues.map((colleague) => (
              <option key={colleague.id} value={colleague.id}>
                {colleague.firstName} {colleague.lastName}
              </option>
            ))}
          </select>
          <button
            onClick={handleSetAvailability}
            disabled={!selectedColleague}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Clock className="w-4 h-4 mr-2" />
            Set Availability
          </button>
        </div>
      </div>

      {selectedColleague && (
        <AvailabilityModal
          colleague={selectedColleague}
          onClose={() => setSelectedColleague(null)}
        />
      )}
    </div>
  );
}