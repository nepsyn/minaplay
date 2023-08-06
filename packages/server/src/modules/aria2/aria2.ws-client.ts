import { WebSocket as Aria2WebSocket } from 'libaria2';

export class Aria2WsClient extends Aria2WebSocket.Client {
  public conn = this._conn;
}
