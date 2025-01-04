import { User } from '../../types/user';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string;
    userId: string;
  };
  userSettings?: User['settings'];
}

export function EventCard({ event, userSettings }: EventCardProps) {
  const colleagueSettings = userSettings?.colleagues?.[event.userId];
  const backgroundColor = colleagueSettings?.color || '#e2e8f0';
  const prefix = colleagueSettings?.abbrev ? `[${colleagueSettings.abbrev}] ` : '';

  return (
    <div
      className="text-xs truncate px-1 py-0.5 rounded text-white"
      style={{ 
        backgroundColor,
        color: backgroundColor === '#fee090' || backgroundColor === '#e0f3f8' ? '#1a202c' : 'white'
      }}
    >
      {prefix}{event.title}
    </div>
  );
}