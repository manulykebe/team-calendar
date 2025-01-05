import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getUsers, updateUser } from "../../../lib/api";
import { User } from "../../../types/user";
import { userSettingsEmitter } from "../../../hooks/useColleagueSettings";

export function useUserSettings() {
  const { token } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token) return;
      try {
        const users = await getUsers(token);
        const userEmail = localStorage.getItem("userEmail");
        const user = users.find((u) => u.email === userEmail);
        if (user) {
          setCurrentUser(user);
        }
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      }
    };

    fetchCurrentUser();

    const handleSettingsUpdate = ({
      userId,
      settings,
      app,
    }: {
      userId: string;
      settings: any;
      app?: { weekStartsOn: string };
    }) => {
      setCurrentUser((prev) =>
        prev && prev.id === userId ? { ...prev, settings, app } : prev
      );
    };

    userSettingsEmitter.on("settingsUpdated", handleSettingsUpdate);

    return () => {
      userSettingsEmitter.off("settingsUpdated", handleSettingsUpdate);
    };
  }, [token]);

  const updateWorkStartDay = async (value: string) => {
    if (!currentUser || !token) return;

    const updatedUser = {
      ...currentUser,
      app: {
        ...currentUser.app,
        weekStartsOn: value
      }
    };

    // Remove password from the update payload
    const { password, ...userWithoutPassword } = updatedUser;

    try {
      await updateUser(token, currentUser.id, userWithoutPassword);
      setCurrentUser(updatedUser);
      userSettingsEmitter.emit("settingsUpdated", {
        userId: currentUser.id,
        settings: updatedUser.settings,
        app: updatedUser.app
      });
    } catch (error) {
      console.error("Failed to update work start day:", error);
      throw error;
    }
  };

  return {
    currentUser,
    updateWorkStartDay
  };
}