import { GameHost } from '../game/gameHost';
import { peerHost } from './peerObjects';

const gameHost = new GameHost();

peerHost.onMessage('game_start_signal', () => {
  gameHost.startGame();
});

peerHost.onMessage('game_end', () => {
  gameHost.endGame();
});
