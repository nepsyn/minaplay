import { SeriesEntity } from '@/api/interfaces/series.interface';
import { MediaEntity } from '@/api/interfaces/media.interface';

export interface MinaPlayText {
  type: 'Text';
  color?: string;
  content: string;
}

export interface MinaPlayNetworkImage {
  type: 'NetworkImage';
  url: string;
}

export interface MinaPlayBase64Image {
  type: 'Base64Image';
  content: string;
}

export interface MinaPlayAction {
  type: 'Action';
  value: string;
  text: MinaPlayText;
}

export interface MinaPlayConsumableGroup {
  type: 'ConsumableGroup';
  id: string;
  items: MinaPlayMessage[];
}

export interface MinaPlayConsumed {
  type: 'Consumed';
  id: string;
}

export interface MinaPlayTimeout {
  type: 'Timeout';
  ms: number;
}

export interface MinaPlayPending {
  type: 'Pending';
  color?: string;
}

export interface MinaPlayMarkdownText {
  type: 'MarkdownText';
  content: string;
}

export interface MinaPlayResourceSeries {
  type: 'ResourceSeries';
  series: SeriesEntity;
}

export interface MinaPlayResourceMedia {
  type: 'ResourceMedia';
  media: MediaEntity;
}

export type MinaPlayMessage =
  | MinaPlayText
  | MinaPlayNetworkImage
  | MinaPlayBase64Image
  | MinaPlayAction
  | MinaPlayConsumableGroup
  | MinaPlayConsumed
  | MinaPlayTimeout
  | MinaPlayPending
  | MinaPlayMarkdownText
  | MinaPlayResourceSeries
  | MinaPlayResourceMedia;
