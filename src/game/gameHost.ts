import { peer } from '../connection/peer';
import { peerHost } from '../connection/peerObjects';
import { Game, RotationDirection, type Player } from './Game';

// TODO: remove null types
export class GameHost {
  private game: Game | null;
  private playOrder: Map<Player, string> | null;

  constructor() {
    this.game = null;
    this.playOrder = null;

    peerHost.onMessage('place_in_column', this.handlePlaceInColumn, this);
    peerHost.onMessage('rotate_board', this.handleRotateBoard, this);
  }

  private getPeerIdOfPlayer(player: Player) {
    if (!this.playOrder) {
      return;
    }

    return this.playOrder.get(player);
  }

  private handlePlaceInColumn(column: number) {
    if (!this.game) {
      return;
    }

    const { col, row, token } = this.game.placeInColumn(column);
    const winner = this.game.checkForEndState();

    peerHost.broadcast(
      'place_in_column',
      col,
      row,
      token,
      this.game.currentPlayer,
      winner,
    );
  }

  private handleRotateBoard(direction: RotationDirection) {
    if (!this.game) {
      return;
    }

    const nextPlacedTokens = this.game.rotateBoard(direction);
    const winner = this.game.checkForEndState();

    peerHost.broadcast(
      'rotate_board',
      nextPlacedTokens,
      this.game.rotation,
      this.game.currentPlayer,
      winner,
    );
  }

  endGame() {
    this.game = null;
    this.playOrder = null;
  }

  startGame() {
    this.game = new Game();
    const nextPlayer = this.game.currentPlayer === 'red' ? 'yellow' : 'red';

    const selfId = peer.id;
    const opponentId = peerHost.peerIds[0];

    const firstToPlay = Math.random() < 0.5 ? selfId : opponentId;
    const nextToPlay = firstToPlay === selfId ? opponentId : selfId;

    this.playOrder = new Map([
      [this.game.currentPlayer, firstToPlay],
      [nextPlayer, nextToPlay],
    ]);

    peerHost.sendToClient(
      this.getPeerIdOfPlayer(this.game.currentPlayer)!,
      'game_start',
      this.game.currentPlayer,
      this.game.currentPlayer,
    );
    peerHost.sendToClient(
      this.getPeerIdOfPlayer(nextPlayer)!,
      'game_start',
      this.game.currentPlayer,
      nextPlayer,
    );
  }
}
