import { useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { updateUser } from "../lib/api";
import { EventEmitter } from "../utils/eventEmitter";
import toast from "react-hot-toast";

export const userSettingsEmitter = new EventEmitter();

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

export function useColleagueSettings() {
  const { token } = useAuth();
  const { currentUser, colleagues, refreshData, isLoading: loading, error } = useApp();

  const updateSettings = useCallback(async (
    colleagueId: string,
    updates: {
      color?: string;
      initials?: string;
      visible?: boolean;
      colleagueOrder?: string[];
    }
  ) => {
    if (!currentUser || !token) return;

    let newSettings;
    if (colleagueId === "order") {
      // Handle order update
      newSettings = {
        ...currentUser.settings,
        colleagueOrder: updates.colleagueOrder,
      };
    } else {
      // Handle colleague-specific settings
      newSettings = {
        ...currentUser.settings,
        colleagues: {
          ...currentUser.settings?.colleagues,
          [colleagueId]: {
            ...currentUser.settings?.colleagues?.[colleagueId],
            ...updates,
          },
        },
      };
    }

    try {
      await updateUser(token, currentUser.id, { settings: newSettings });
      await refreshData(); // Refresh context data after successful update

      userSettingsEmitter.emit("settingsUpdated", {
        userId: currentUser.id,
        settings: newSettings,
      });

      toast.success("Settings updated successfully");
    } catch (err) {
      toast.error("Failed to update settings");
      throw err;
    }
  }, [currentUser, token, refreshData]);

  const getColleagueSettings = useCallback((colleagueId: string) => {
    return (
      currentUser?.settings?.colleagues?.[colleagueId] || {
        color: DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
        initials: "",
      }
    );
  }, [currentUser]);

  return {
    colleagues: colleagues || [],
    currentUser,
    loading,
    error: error || "",
    updateSettings,
    getColleagueSettings,
    DEFAULT_COLORS,
    refresh: refreshData,
  };
}