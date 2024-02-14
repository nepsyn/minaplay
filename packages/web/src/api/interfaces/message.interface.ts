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

export interface MinaPlayConsumableFeedback {
  type: 'ConsumableFeedback';
  id: string;
  value: string;
}

export interface MinaPlayConsumed {
  type: 'Consumed';
  id: string;
}

export interface MinaPlayTimeout {
  type: 'Timeout';
  ms: number;
}

export type MinaPlayMessage =
  | MinaPlayText
  | MinaPlayNetworkImage
  | MinaPlayBase64Image
  | MinaPlayAction
  | MinaPlayConsumableGroup
  | MinaPlayConsumableFeedback
  | MinaPlayConsumed
  | MinaPlayTimeout;
