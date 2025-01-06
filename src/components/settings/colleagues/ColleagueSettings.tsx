import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ColleagueRow } from "./ColleagueRow";
import { useColleagueSettings } from "../../../hooks/useColleagueSettings";
import { User } from "../../../types/user";

interface ColleagueSettingsProps {
  onClose: () => void;
}

export function ColleagueSettings({ onClose }: ColleagueSettingsProps) {
  const {
    colleagues,
    loading,
    error,
    updateSettings,
    getColleagueSettings,
    DEFAULT_COLORS,
    currentUser,
  } = useColleagueSettings();

  const [orderedColleagues, setOrderedColleagues] = useState<User[]>([]);
  const [visibilityState, setVisibilityState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (colleagues.length > 0 && currentUser) {
      // Get saved order from settings or create default order
      const savedOrder = currentUser.settings?.colleagueOrder || [];
      const orderedList = [...colleagues];
      
      // Sort based on saved order
      orderedList.sort((a, b) => {
        const aIndex = savedOrder.indexOf(a.id);
        const bIndex = savedOrder.indexOf(b.id);
        
        // Put items not in saved order at the end
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        
        return aIndex - bIndex;
      });

      // Move current user to top
      const currentUserIndex = orderedList.findIndex((c) => c.id === currentUser.id);
      if (currentUserIndex !== -1) {
        const [currentUserData] = orderedList.splice(currentUserIndex, 1);
        orderedList.unshift(currentUserData);
      }

      setOrderedColleagues(orderedList);

      // Initialize visibility state
      const initialVisibility = colleagues.reduce((acc, colleague) => {
        const settings = currentUser.settings?.colleagues?.[colleague.id];
        acc[colleague.id] = settings?.visible !== false;
        return acc;
      }, {} as Record<string, boolean>);
      setVisibilityState(initialVisibility);
    }
  }, [colleagues, currentUser]);

  const handleVisibilityToggle = async (colleagueId: string) => {
    if (!currentUser || colleagueId === currentUser.id) return;

    const newVisibility = !visibilityState[colleagueId];
    setVisibilityState((prev) => ({
      ...prev,
      [colleagueId]: newVisibility
    }));

    try {
      const currentSettings = getColleagueSettings(colleagueId);
      await updateSettings(colleagueId, {
        ...currentSettings,
        visible: newVisibility
      });
    } catch (err) {
      setVisibilityState((prev) => ({
        ...prev,
        [colleagueId]: !newVisibility
      }));
      console.error("Failed to update visibility:", err);
    }
  };

  const moveColleague = async (dragIndex: number, hoverIndex: number) => {
    if (!currentUser || dragIndex === 0 || hoverIndex === 0) return; // Prevent moving current user

    const newOrder = [...orderedColleagues];
    const [draggedColleague] = newOrder.splice(dragIndex, 1);
    newOrder.splice(hoverIndex, 0, draggedColleague);
    setOrderedColleagues(newOrder);

    // Save new order to settings
    const colleagueOrder = newOrder.map(c => c.id);
    try {
      await updateSettings('order', { colleagueOrder });
    } catch (err) {
      console.error("Failed to save colleague order:", err);
      // Revert on error
      setOrderedColleagues([...colleagues]);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-pulse">Loading colleagues...</div>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-semibold text-zinc-900">
              Colleague Display Settings
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-500"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="p-4 text-red-600 bg-red-50 border-l-4 border-red-500">
              {error}
            </div>
          )}

          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {orderedColleagues.map((colleague, index) => (
              <ColleagueRow
                key={colleague.id}
                colleague={colleague}
                settings={getColleagueSettings(colleague.id)}
                colors={DEFAULT_COLORS}
                onColorChange={(id, color) => updateSettings(id, { color })}
                onAbbrevChange={(id, initials) => updateSettings(id, { initials })}
                onVisibilityToggle={handleVisibilityToggle}
                isVisible={visibilityState[colleague.id]}
                index={index}
                moveColleague={moveColleague}
              />
            ))}
          </div>
        </div>
      </div>
    </DndProvider>
  );
}