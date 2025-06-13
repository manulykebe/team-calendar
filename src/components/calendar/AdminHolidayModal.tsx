import { useState } from "react";
import { X, Check, XCircle, User, Clock, Calendar } from "lucide-react";
import { Event } from "../../types/event";
import { User as UserType } from "../../types/user";
import { useAuth } from "../../context/AuthContext";
import { updateEvent } from "../../lib/api";
import toast from "react-hot-toast";
import { format } from "date-fns";
import ReactDOM from "react-dom";

interface AdminHolidayModalProps {
  event: Event;
  eventOwner: UserType | null;
  onClose: () => void;
  onUpdate: () => void;
}

export function AdminHolidayModal({
  event,
  eventOwner,
  onClose,
  onUpdate,
}: AdminHolidayModalProps) {
  const { token } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const getEventTypeLabel = (eventType: string, eventStatus: string): string => {
    switch (eventType) {
      case "requestedHoliday":
        switch (eventStatus) {
          case "approved":
            return "Approved Holiday";
          case "denied":
            return "Denied Holiday";
          case "pending":
            return "Pending Holiday";
          default:
        return "Holiday Request";
        }
      case "requestedDesiderata":
        return "Desiderata Request";
      case "requestedPeriod":
        return "Period Request";
      default:
        return eventType
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase());
    }
  };

  const getStatusLabel = (status?: string): string => {
    switch (status) {
      case "approved":
        return "Approved";
      case "denied":
        return "Denied";
      case "pending":
      default:
        return "Pending";
    }
  };

  const getStatusColor = (status?: string): string => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "denied":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  const handleStatusUpdate = async (newStatus: 'approved' | 'denied') => {
    if (!token || !eventOwner) return;

    setIsUpdating(true);
    const toastId = toast.loading(`${newStatus === 'approved' ? 'Approving' : 'Denying'} request...`);

    try {
      // Use the admin update endpoint with userId specified
      await updateEvent(token, event.id, {
        ...event,
        status: newStatus,
        userId: eventOwner.id, // Specify which user's event to update
      });

      toast.success(
        `Request ${newStatus === 'approved' ? 'approved' : 'denied'} successfully`,
        { id: toastId }
      );

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to update event status:', error);
      toast.error(
        `Failed to ${newStatus === 'approved' ? 'approve' : 'deny'} request`,
        { id: toastId }
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // Get colleague avatar color and initials
  const getColleagueDisplay = () => {
    if (!eventOwner) {
      return {
        color: "#6b7280",
        initials: "?",
        name: "Unknown User",
        email: ""
      };
    }

    // Try to get settings from the event owner's own settings first
    const ownerSettings = eventOwner.settings?.colleagues?.[eventOwner.id];
    
    return {
      color: ownerSettings?.color || "#6b7280",
      initials: ownerSettings?.initials || `${eventOwner.firstName[0]}${eventOwner.lastName[0]}`,
      name: `${eventOwner.firstName} ${eventOwner.lastName}`,
      email: eventOwner.email
    };
  };

  const colleagueDisplay = getColleagueDisplay();

  const modalContent = (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-zinc-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">
                Request Management
              </h3>
              <p className="text-sm text-zinc-500">Admin Review</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-500 transition-colors"
            disabled={isUpdating}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Employee Information */}
          <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
            <h4 className="text-sm font-medium text-zinc-700 mb-3">Employee Information</h4>
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm"
                style={{ backgroundColor: colleagueDisplay.color }}
              >
                {colleagueDisplay.initials}
              </div>
              <div className="flex-1">
                <p className="font-medium text-zinc-900">{colleagueDisplay.name}</p>
                <p className="text-sm text-zinc-500">{colleagueDisplay.email}</p>
              </div>
            </div>
          </div>

          {/* Request Status */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-zinc-700 mb-1">Current Status</h4>
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(event.status)}`}>
                {getStatusLabel(event.status)}
              </span>
            </div>
            <div className="text-right">
              <h4 className="text-sm font-medium text-zinc-700 mb-1">Request Type</h4>
              <p className="text-sm text-zinc-900 font-medium">{getEventTypeLabel(event.type, event.status||'')}</p>
            </div>
          </div>

          {/* Date Information */}
          <div>
            <h4 className="text-sm font-medium text-zinc-700 mb-2">Date Range</h4>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <p className="text-blue-900 font-medium">
                  {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
                  {event.endDate && event.endDate !== event.date && (
                    <>
                      <span className="text-blue-600 mx-2">→</span>
                      {format(new Date(event.endDate), "EEEE, MMMM d, yyyy")}
                    </>
                  )}
                </p>
              </div>
              {event.endDate && event.endDate !== event.date && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <p className="text-sm text-blue-600">
                    Duration: {Math.ceil((new Date(event.endDate).getTime() - new Date(event.date).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Request Details */}
          {(event.title || event.description) && (
            <div className="space-y-3">
              {event.title && (
                <div>
                  <h4 className="text-sm font-medium text-zinc-700 mb-1">Title</h4>
                  <p className="text-zinc-900 bg-zinc-50 p-2 rounded border">{event.title}</p>
                </div>
              )}

              {event.description && (
                <div>
                  <h4 className="text-sm font-medium text-zinc-700 mb-1">Description</h4>
                  <p className="text-zinc-900 bg-zinc-50 p-2 rounded border whitespace-pre-wrap">{event.description}</p>
                </div>
              )}
            </div>
          )}

          {/* Submission Information */}
          <div className="text-xs text-zinc-500 bg-zinc-50 p-2 rounded border">
            <p>Submitted on {format(new Date(event.createdAt), "MMMM d, yyyy 'at' h:mm a")}</p>
            {event.updatedAt !== event.createdAt && (
              <p>Last updated on {format(new Date(event.updatedAt), "MMMM d, yyyy 'at' h:mm a")}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end items-center gap-3 p-6 border-t bg-zinc-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors disabled:opacity-50"
            disabled={isUpdating}
          >
            Close
          </button>
          
          {event.status !== 'denied' && (
            <button
              onClick={() => handleStatusUpdate('denied')}
              disabled={isUpdating}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <XCircle className="w-4 h-4 mr-2" />
              {isUpdating ? 'Processing...' : 'Deny Request'}
            </button>
          )}

          {event.status !== 'approved' && (
            <button
              onClick={() => handleStatusUpdate('approved')}
              disabled={isUpdating}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Check className="w-4 h-4 mr-2" />
              {isUpdating ? 'Processing...' : 'Approve Request'}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}