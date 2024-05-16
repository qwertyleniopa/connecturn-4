import { peer } from './peer';
import { PeerClient } from './PeerClient';
import { PeerHost } from './PeerHost';

export const peerClient = new PeerClient(peer);
export const peerHost = new PeerHost(peer);
