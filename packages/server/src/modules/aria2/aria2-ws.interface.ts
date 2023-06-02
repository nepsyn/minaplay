export type Aria2WsMessage = {
  jsonrpc: string;

  method:
    | 'aria2.onDownloadStart'
    | 'aria2.onDownloadStop'
    | 'aria2.onDownloadComplete'
    | 'aria2.onDownloadError'
    | 'aria2.onBtDownloadComplete';

  params: { gid: string }[];
};
