import { User } from "../../../types/user";

export interface ColleagueSettings {
  color: string;
  initials: string;
  visible?: boolean;
}

export interface DragItem {
  id: string;
  index: number;
}

export interface ColleagueRowProps {
  colleague: User;
  settings: ColleagueSettings;
  colors: string[];
  onColorChange: (id: string, color: string) => void;
  onAbbrevChange: (id: string, initials: string) => void;
  onVisibilityToggle: (id: string) => void;
  isVisible: boolean;
  index: number;
  moveColleague: (dragIndex: number, hoverIndex: number) => void;
}