import { User } from '../../types/user';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string;
    userId: string;
  };
  user?: User;
  userSettings?: User['settings'];
}

export function EventCard({ event, user, userSettings }: EventCardProps) {
  const colleagueSettings = userSettings?.colleagues?.[event.userId];
  const backgroundColor = colleagueSettings?.color || '#e2e8f0';
  const displayText = colleagueSettings?.abbrev || event.description || event.title;

  return (
    <div
      className="text-xs truncate px-1 py-0.5 rounded text-white"
      style={{ 
        backgroundColor,
        color: backgroundColor === '#fee090' || backgroundColor === '#e0f3f8' ? '#1a202c' : 'white'
      }}
    >
      {displayText}
    </div>
  );
}