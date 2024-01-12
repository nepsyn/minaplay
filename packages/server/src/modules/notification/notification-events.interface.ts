import { Episode } from '../series/episode.entity.js';
import { Media } from '../media/media.entity.js';

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
