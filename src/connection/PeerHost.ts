import EventEmitter from 'eventemitter3';
import type { DataConnection, Peer } from 'peerjs';

import type { Message } from './messages';
import { peerClient } from './peerObjects';
import type { Player } from '../game/Game';

interface PeerHostEvents {
  game_start: (currentPlayer: Player, selfPlayer: Player) => void;
}

export class PeerHost extends EventEmitter<PeerHostEvents> {
  private readonly peer: Peer;
  private readonly connections: Map<string, DataConnection>;

  private messages: EventEmitter;

  acceptIncoming: boolean = false;

  constructor(peer: Peer) {
    super();

    this.peer = peer;
    this.peer.on('connection', this.handleIncomingConnection, this as any);

    this.connections = new Map();

    this.messages = new EventEmitter();

    // Unexpected tab closing doesn't trigger any PeerJS events, so we need to rely
    // on native tab closing events instead.
    window.addEventListener('beforeunload', () => {
      // this.send(this.peerId, { name: 'peer_close' });
      this.broadcast('unexpected_disconnect');
    });
  }

  get peerIds() {
    return Array.from(this.connections.keys());
  }

  private handleIncomingConnection(clientConn: DataConnection) {
    if (!this.acceptIncoming) {
      clientConn.close();
      return;
    }

    clientConn.on('data', <any>this.handleIncomingMessage, <any>this);
    clientConn.on('close', () => {
      this.connections.delete(clientConn.peer);
      this.broadcast('unexpected_disconnect');
    });

    this.connections.set(clientConn.peer, clientConn);
  }

  private handleIncomingMessage(data: Message) {
    if (data.recipient === 'host') {
      this.messages.emit(data.name, ...data.args);
    }
  }

  broadcast(name: string, ...args: unknown[]) {
    for (const connection of this.connections.values()) {
      const message: Message = {
        recipient: 'client',
        name,
        args,
      };

      if (connection.open) {
        connection.send(message);
      } else {
        connection.once('open', () => connection.send(message));
      }
    }

    // Consider self as well.
    // TODO: Coupled too tightly? XD
    peerClient['messages'].emit(name, ...args);
  }

  onMessage(name: string, callback: (...args: any[]) => void, context?: any) {
    this.messages.on(name, callback, context);
  }

  sendToClient(peerId: string, name: string, ...args: unknown[]) {
    // Consider self as well.
    // TODO: Coupled too tightly? XD
    if (peerId === this.peer.id) {
      peerClient['messages'].emit(name, ...args);
      return;
    }

    const clientConn = this.connections.get(peerId);

    if (!clientConn) {
      throw new Error();
    }

    const message: Message = {
      recipient: 'client',
      name,
      args,
    };

    if (clientConn.open) {
      clientConn.send(message);
    } else {
      clientConn.once('open', () => clientConn.send(message));
    }
  }
}
