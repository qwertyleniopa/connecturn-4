import type {
  PlacedToken,
  Player,
  RotationDirection,
  Winner,
} from '../game/Game';

export interface Message {
  recipient: 'client' | 'host';
  name: string;
  args: unknown[];
}

export interface ClientMessage {
  game_start_signal: () => void;
  place_in_column: (column: number) => void;
  rotate_board: (direction: RotationDirection) => void;
}

export interface ServerMessage {
  game_start: () => void;
  place_in_column: (
    tokenCol: number,
    tokenRow: number,
    token: Player,
    nextPlayer: Player,
    winnerPlayer: Winner,
  ) => void;
  rotate_board: (
    nextPlacedTokens: PlacedToken[],
    nextRotation: number,
    nextPlayer: Player,
    winnerPlayer: Winner,
  ) => void;
  unexpected_disconnect: () => void;
}
