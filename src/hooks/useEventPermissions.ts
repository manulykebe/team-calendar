import { Event } from "../types/event";
import { User } from "../types/user";

export function useEventPermissions(event: Event, currentUser?: User | null) {
  const isAdmin = currentUser?.role === "admin";
  const isOwner = currentUser?.id === event.userId;
  const canModify = isAdmin || isOwner;

  return {
    canModify,
    isAdmin,
    isOwner
  };
}