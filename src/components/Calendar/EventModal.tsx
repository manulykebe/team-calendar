import React from 'react';
import { X } from 'lucide-react';
import { CalendarEvent } from '../../types/calendar';

interface EventModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
}

export function EventModal({ event, onClose }: EventModalProps) {
  if (!event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">{event.title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-gray-600">Description</p>
            <p>{event.description}</p>
          </div>
          
          <div>
            <p className="text-gray-600">Time</p>
            <p>
              {new Date(event.start).toLocaleString()} -{' '}
              {new Date(event.end).toLocaleString()}
            </p>
          </div>
          
          <div>
            <p className="text-gray-600">Attendees</p>
            <div className="flex flex-wrap gap-2">
              {event.attendees.map(attendee => (
                <span
                  key={attendee}
                  className="px-2 py-1 bg-gray-100 rounded-full text-sm"
                >
                  {attendee}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}