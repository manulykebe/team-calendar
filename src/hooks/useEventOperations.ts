import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { createEvent, updateEvent, deleteEvent } from '../lib/api/events';
import { useUndoRedo, UndoRedoAction } from './useUndoRedo';
import { Event } from '../types/event';
import { useTranslation } from '../context/TranslationContext';
import toast from 'react-hot-toast';

export function useEventOperations() {
  const { token } = useAuth();
  const { refreshData } = useApp();
  const { t } = useTranslation();
  const { addAction, undo, redo, canUndo, canRedo, isUndoing, isRedoing } = useUndoRedo();

  const createEventWithUndo = useCallback(async (eventData: {
    title: string;
    description: string;
    date: string;
    endDate?: string;
    type: string;
    userId?: string;
    amSelected?: boolean;
    pmSelected?: boolean;
  }) => {
    if (!token) throw new Error('Authentication required');

    // Handle AM/PM selection for single day events
    let title = eventData.title;
    if (eventData.amSelected !== undefined && eventData.pmSelected !== undefined) {
      if (eventData.amSelected && !eventData.pmSelected) {
        title = title ? `${title} (AM)` : "AM only";
      } else if (!eventData.amSelected && eventData.pmSelected) {
        title = title ? `${title} (PM)` : "PM only";
      }
    }

    const finalEventData = { ...eventData, title };
    
    // Create the event
    const createdEvent = await createEvent(token, finalEventData);
    
    // Refresh data
    await refreshData();

    // Create undo action
    const undoAction: UndoRedoAction = {
      id: `create-${createdEvent.id}`,
      type: 'create',
      description: t('undoRedo.createdEvent', { title: createdEvent.title || t('events.untitledEvent') }),
      timestamp: Date.now(),
      undo: async () => {
        await deleteEvent(token, createdEvent.id, createdEvent.userId);
        await refreshData();
        toast.success(t('undoRedo.undoCreate'), {
          duration: 6000,
          icon: '↩️',
        });
      },
      redo: async () => {
        await createEvent(token, finalEventData);
        await refreshData();
        toast.success(t('undoRedo.redoCreate'), {
          duration: 6000,
          icon: '↪️',
        });
      }
    };

    addAction(undoAction);
    
    // Show success toast with undo icon
    toast.success(t('calendar.eventCreated'), {
      duration: 6000,
      icon: '↩️',
    });
    
    return createdEvent;
  }, [token, refreshData, addAction, t]);

  const updateEventWithUndo = useCallback(async (
    eventId: string,
    newEventData: Partial<Event>,
    originalEvent: Event
  ) => {
    if (!token) throw new Error('Authentication required');

    // Update the event
    const updatedEvent = await updateEvent(token, eventId, newEventData);
    
    // Refresh data
    await refreshData();

    // Create undo action
    const undoAction: UndoRedoAction = {
      id: `update-${eventId}`,
      type: 'update',
      description: t('undoRedo.updatedEvent', { title: updatedEvent.title || t('events.untitledEvent') }),
      timestamp: Date.now(),
      undo: async () => {
        await updateEvent(token, eventId, {
          title: originalEvent.title,
          description: originalEvent.description,
          date: originalEvent.date,
          endDate: originalEvent.endDate,
          type: originalEvent.type,
          status: originalEvent.status,
          userId: originalEvent.userId
        });
        await refreshData();
        toast.success(t('undoRedo.undoUpdate'), {
          duration: 5000,
          icon: '↩️'
        });
      },
      redo: async () => {
        await updateEvent(token, eventId, newEventData);
        await refreshData();
        toast.success(t('undoRedo.redoUpdate'), {
          duration: 5000,
          icon: '↪️'
        });
      }
    };

    addAction(undoAction);
    return updatedEvent;
  }, [token, refreshData, addAction, t]);

  const deleteEventWithUndo = useCallback(async (event: Event) => {
    if (!token) throw new Error('Authentication required');

    // Delete the event
    await deleteEvent(token, event.id, event.userId);
    
    // Refresh data
    await refreshData();

    // Create undo action
    const undoAction: UndoRedoAction = {
      id: `delete-${event.id}`,
      type: 'delete',
      description: t('undoRedo.deletedEvent', { title: event.title || t('events.untitledEvent') }),
      timestamp: Date.now(),
      undo: async () => {
        await createEvent(token, {
          title: event.title,
          description: event.description,
          date: event.date,
          endDate: event.endDate,
          type: event.type,
          userId: event.userId
        });
        await refreshData();
        toast.success(t('undoRedo.undoDelete'), {
          duration: 5000,
          icon: '↩️'
        });
      },
      redo: async () => {
        await deleteEvent(token, event.id, event.userId);
        await refreshData();
        toast.success(t('undoRedo.redoDelete'), {
          duration: 5000,
          icon: '↪️'
        });
      }
    };

    addAction(undoAction);
  }, [token, refreshData, addAction, t]);

  return {
    createEventWithUndo,
    updateEventWithUndo,
    deleteEventWithUndo,
    undo,
    redo,
    canUndo,
    canRedo,
    isUndoing,
    isRedoing,
  };
}