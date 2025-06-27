import { Event } from "../types/event";
import { User } from "../types/user";

export function useEventPermissions(event: Event, currentUser?: User | null) {
  const isAdmin = currentUser?.role === "admin";
  const isOwner = currentUser?.id === event.userId;
  
  // Admins can modify any holiday request
  const canModifyHoliday = isAdmin && 
    (event.type === "requestedLeave" || event.type === "requestedDesiderata");
  
  // Users can modify their own events
  const canModify = isAdmin || isOwner || canModifyHoliday;

  return {
    canModify,
    isAdmin,
    isOwner,
    canModifyHoliday
  };
}