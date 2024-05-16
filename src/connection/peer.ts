import Peer from 'peerjs';

export const peer = new Peer();

export function peerIsReady() {
  return new Promise<void>(resolve => {
    if (peer.open) {
      resolve();
      return;
    }

    // @ts-ignore
    peer.once('open', resolve);
  });
}
