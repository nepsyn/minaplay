import { Episode } from '../series/episode.entity';
import { Media } from '../media/media.entity';

export type NotificationEventMap = {
  'new-episode': {
    episode: Episode;
    time: Date;
  };
  'new-media': {
    media: Media;
    time: Date;
  };
};

export type NotificationEventType = keyof NotificationEventMap;
