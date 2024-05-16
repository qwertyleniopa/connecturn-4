import EventEmitter from 'eventemitter3';
import type { DataConnection, Peer, PeerError } from 'peerjs';
import type { Message } from './messages';
import { peerHost } from './peerObjects';

// TODO: Clarify events
interface PeerClientEvents {
  disconnect: () => void;
  host_error: (err?: PeerError<string>) => void;
  self_error: (err?: PeerError<string>) => void;
}

export class PeerClient extends EventEmitter<PeerClientEvents> {
  private readonly peer: Peer;
  private hostConnection: DataConnection | null;

  private messages: EventEmitter;

  constructor(peer: Peer) {
    super();

    this.peer = peer;
    this.peer.on('disconnected', () => this.emit('self_error'));
    this.peer.on('error', err => this.emit('self_error', err));

    this.hostConnection = null;

    this.messages = new EventEmitter();

    // Unexpected tab closing doesn't trigger any PeerJS events, so we need to rely
    // on native tab closing events instead.
    window.addEventListener('beforeunload', () => {
      // this.send(this.peerId, { name: 'peer_close' });
      this.disconnectFromHost();
    });
  }

  private handleIncomingMessage(data: Message) {
    if (data.recipient === 'client') {
      this.messages.emit(data.name, ...data.args);
    }
  }

  connectToHost(hostId: string) {
    if (this.hostConnection?.open) {
      throw new Error(
        'Cannot connect to new host when existing connection exists.',
      );
    }

    this.hostConnection = this.peer.connect(hostId);
    this.hostConnection.on('data', <any>this.handleIncomingMessage, <any>this);
    this.hostConnection.on('close', () => {
      this.hostConnection = null;
      this.emit('disconnect');
    });
    this.hostConnection.on('error', err => this.emit('host_error', err));
  }

  disconnectFromHost() {
    if (!this.hostConnection) {
      throw new Error('Cannot disconnect from nonexistent host.');
    }

    this.hostConnection.close();
    this.hostConnection = null;
  }

  isConnected() {
    return new Promise<void>(resolve => {
      if (this.hostConnection && this.hostConnection.open) {
        resolve();
        return;
      }

      // @ts-ignore
      this.hostConnection.once('open', resolve);
    });
  }

  onMessage(name: string, callback: (...args: any[]) => void, context?: any) {
    this.messages.on(name, callback, context);
  }

  sendToHost(name: string, ...args: unknown[]) {
    // Consider self as well.
    // TODO: Coupled too tightly? XD
    if (peerHost.peerIds.length !== 0) {
      peerHost['messages'].emit(name, ...args);
      return;
    }

    if (!this.hostConnection || !this.hostConnection.open) {
      throw new Error('Cannot send to nonexistent or unready host.');
    }

    const message: Message = {
      recipient: 'host',
      name,
      args,
    };
    this.hostConnection.send(message);
  }
}
