import "./LiveAnnouncer.css";

interface LiveAnnouncerProps {
  message: string;
}

export function LiveAnnouncer({ message }: LiveAnnouncerProps) {
  return (
    <div className="live-announcer" aria-live="polite" aria-atomic="true" role="status">
      {message}
    </div>
  );
}
