import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SettingsState } from "../types";

interface SettingsStore extends SettingsState {
  updateSettings: (settings: Partial<SettingsState>) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: "system",
      showWeekends: true,
      weekStartsOnMonday: false,

      updateSettings: (settings) => set((state) => ({ ...state, ...settings })),
    }),
    {
      name: "calendar-settings",
    },
  ),
);
