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

export interface MinaPlayOption {
  type: 'Option';
  id: string;
  text: MinaPlayText;
}

export interface MinaPlayActionGroup {
  type: 'ActionGroup';
  id: string;
  options: MinaPlayOption[];
}

export interface MinaPlayFeedback {
  type: 'Feedback';
  groupId: string;
  optionId: string;
}

export type MinaPlayMessage =
  | MinaPlayText
  | MinaPlayNetworkImage
  | MinaPlayBase64Image
  | MinaPlayOption
  | MinaPlayActionGroup
  | MinaPlayFeedback;
