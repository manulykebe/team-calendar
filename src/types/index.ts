// Export all types from a central location
export * from './event';
export * from './user';

// Common types used across components
export interface BaseComponentProps {
  className?: string;
}

export interface ModalProps {
  onClose: () => void;
}

export interface WithChildren {
  children: React.ReactNode;
}