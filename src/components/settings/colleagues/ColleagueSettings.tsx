import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ColleagueRow } from "./ColleagueRow";
import { useApp } from "../../../context/AppContext";
import { useAuth } from "../../../context/AuthContext";
import { updateUser } from "../../../lib/api/users";
import { User } from "../../../types/user";
import toast from "react-hot-toast";
import { userSettingsEmitter } from "../../../hooks/useColleagueSettings";
import { useTranslation } from "../../../context/TranslationContext";

interface ColleagueSettingsProps {
  onClose: () => void;
}

export const DEFAULT_COLORS = [
  "#a50026",
  "#d73027",
  "#f46d43",
  "#fdae61",
  "#fee090",
  "#e0f3f8",
  "#abd9e9",
  "#74add1",
  "#4575b4",
  "#313695",
];

export function ColleagueSettings({ onClose }: ColleagueSettingsProps) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { currentUser, colleagues } = useApp();
  const [error, setError] = useState("");
  const [localSettings, setLocalSettings] = useState(currentUser?.settings);
  const [orderedColleagues, setOrderedColleagues] = useState<User[]>([]);

  useEffect(() => {
    if (currentUser && colleagues) {
      const savedOrder = currentUser.settings?.colleagueOrder || [];
      const allColleagues = [currentUser, ...colleagues];
      
      // Sort based on saved order
      const orderedList = [...allColleagues];
      orderedList.sort((a, b) => {
        const aIndex = savedOrder.indexOf(a.id);
        const bIndex = savedOrder.indexOf(b.id);

        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;

        return aIndex - bIndex;
      });

      setOrderedColleagues(orderedList);
      setLocalSettings(currentUser.settings);
    }
  }, [currentUser, colleagues]);

  if (!currentUser || !localSettings) {
    return null;
  }

  const getColleagueSettings = (colleagueId: string) => {
    return (
      localSettings.colleagues?.[colleagueId] || {
        color: DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
        initials: "",
      }
    );
  };

  const updateSettings = async (
    colleagueId: string,
    updates: {
      color?: string;
      initials?: string;
      visible?: boolean;
    }
  ) => {
    if (!currentUser || !token) return;

    const newSettings = {
      ...localSettings,
      colleagues: {
        ...localSettings.colleagues,
        [colleagueId]: {
          ...localSettings.colleagues?.[colleagueId],
          ...updates,
        },
      },
    };

    try {
      // Update server
      await updateUser(token, currentUser.id, { settings: newSettings });
      
      // Update local state
      setLocalSettings(newSettings);

      // Emit settings update event
      userSettingsEmitter.emit("settingsUpdated", {
        userId: currentUser.id,
        settings: newSettings
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('settings.errors.updateFailed');
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleVisibilityToggle = async (colleagueId: string) => {
    if (!currentUser || colleagueId === currentUser.id) return;

    const currentVisibility = localSettings.colleagues?.[colleagueId]?.visible;
    const newVisibility = currentVisibility === false ? undefined : false;

    await updateSettings(colleagueId, { visible: newVisibility });
  };

  const moveColleague = async (dragIndex: number, hoverIndex: number) => {
    if (!currentUser || !token || dragIndex === 0 || hoverIndex === 0) return;

    const newOrder = [...orderedColleagues];
    const [draggedColleague] = newOrder.splice(dragIndex, 1);
    newOrder.splice(hoverIndex, 0, draggedColleague);

    setOrderedColleagues(newOrder);

    const newSettings = {
      ...localSettings,
      colleagueOrder: newOrder.map(c => c.id),
    };

    try {
      // Update server
      await updateUser(token, currentUser.id, { settings: newSettings });
      
      // Update local state
      setLocalSettings(newSettings);

      // Emit settings update event
      userSettingsEmitter.emit("settingsUpdated", {
        userId: currentUser.id,
        settings: newSettings
      });
      
      toast.success(t('settings.colleagueOrderUpdated'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('settings.errors.orderUpdateFailed');
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Revert on error
      setOrderedColleagues(orderedColleagues);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-semibold text-zinc-900">
              {t('settings.colleagueDisplaySettings')}
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-500"
              aria-label={t('common.close')}
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
                onAbbrevChange={(id, initials) =>
                  updateSettings(id, { initials })
                }
                onVisibilityToggle={handleVisibilityToggle}
                isVisible={localSettings.colleagues?.[colleague.id]?.visible !== false}
                index={index}
                moveColleague={moveColleague}
                currentUser={currentUser}
              />
            ))}
          </div>
        </div>
      </div>
    </DndProvider>
  );
}