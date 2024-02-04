import { Episode } from '../media/episode/episode.entity.js';
import { Media } from '../media/media.entity.js';
import { NotificationEventEnum } from '../../enums/notification-event.enum.js';

export type NotificationEventMap = {
  [NotificationEventEnum.NEW_EPISODE]: {
    episode: Episode;
    time: Date;
  };
  [NotificationEventEnum.NEW_MEDIA]: {
    media: Media;
    time: Date;
  };
};
