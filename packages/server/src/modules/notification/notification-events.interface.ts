import { Episode } from '../series/episode.entity';

export type NotificationEventMap = {
  'new-episode': {
    episode: Episode;
    time: Date;
  };
};

export type NotificationEventType = keyof NotificationEventMap;
