export enum WebSocketOp {
  READY = 'ready'
}

export interface WebSocketEvent {
  op: WebSocketOp;
}

export interface WebSocketReadyEvent extends WebSocketEvent {
  resumed: boolean;
  sessionId: string;
}
