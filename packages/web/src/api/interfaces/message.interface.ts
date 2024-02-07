export interface MinaPlayText {
  type: 'Text';
  color?: string;
  content: string;
}

export interface MinaPlayNetworkImage {
  type: 'NetworkImage';
  url: string;
}

export type MinaPlayMessage = MinaPlayText | MinaPlayNetworkImage;
