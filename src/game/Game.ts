export type Player = 'red' | 'yellow';
export type Winner = Player | 'draw' | null;

export enum RotationDirection {
  LEFT = 'left',
  RIGHT = 'right',
}

export interface PlacedToken {
  id: number;
  col: number;
  row: number;
  token: Player;
}

export const NUM_COLS = 7;
export const NUM_ROWS = 6;
const WIN_STREAK = 4;

function isValidCoord(col: number, row: number) {
  return col >= 0 && col < NUM_COLS && row >= 0 && row < NUM_ROWS;
}

export class Game {
  private static _tokenCount = 0;

  private _board: (PlacedToken | null)[][];
  private _rotation: number;
  private _currentPlayer: Player;

  constructor() {
    this._board = [...Array(NUM_ROWS)].map(() =>
      new Array(NUM_COLS).fill(null),
    );

    this._currentPlayer = Math.random() < 0.5 ? 'red' : 'yellow';

    this._rotation = 0;
  }

  private get columnCount() {
    return this.baseRotation === 0 ||
      this.baseRotation === 180 ||
      this.baseRotation === -180
      ? NUM_COLS
      : NUM_ROWS;
  }

  get baseRotation() {
    return this._rotation % 360;
  }

  get currentPlayer() {
    return this._currentPlayer;
  }

  get rotation() {
    return this._rotation;
  }

  private findNearestEmptyCell(column: number) {
    for (const [col, row] of this.iterateColumnInReverse(column)) {
      if (this._board[row][col] !== null) {
        continue;
      }

      return [col, row];
    }

    return null;
  }

  private goUpColumn(col: number, row: number) {
    switch (this.baseRotation) {
      case 0:
        return [col, row - 1];

      case 90:
      case -270:
        return [col - 1, row];

      case 180:
      case -180:
        return [col, row + 1];

      case 270:
      case -90:
        return [col + 1, row];

      default:
        throw new Error('Cannot go up a column from a not well-defined angle.');
    }
  }

  private *iterateColumnInReverse(column: number) {
    switch (this.baseRotation) {
      case 0:
        for (let row = NUM_ROWS - 1; row >= 0; row--) {
          yield [column, row];
        }

        break;

      case 90:
      case -270:
        for (let col = NUM_COLS - 1; col >= 0; col--) {
          yield [col, NUM_ROWS - column - 1];
        }

        break;

      case 180:
      case -180:
        for (let row = 0; row < NUM_ROWS; row++) {
          yield [NUM_COLS - column - 1, row];
        }
        break;

      case 270:
      case -90:
        for (let col = 0; col < NUM_COLS; col++) {
          yield [col, column];
        }
        break;
    }
  }

  checkForEndState(): Winner {
    let player: Player | null = null;
    let streak = 0;

    // Horizontal
    for (let row = 0; row < NUM_ROWS; row++) {
      for (let col = 0; col < NUM_COLS; col++) {
        if (this._board[row][col] === null) {
          player = null;
          streak = 0;
          continue;
        }

        if (player === null || this._board[row][col]!.token !== player) {
          player = this._board[row][col]!.token;
          streak = 1;
          continue;
        } else {
          player = this._board[row][col]!.token;
          streak += 1;
        }

        if (streak === WIN_STREAK) {
          return player;
        }
      }

      player = null;
      streak = 0;
    }

    // Vertical
    for (let col = 0; col < NUM_COLS; col++) {
      for (let row = 0; row < NUM_ROWS; row++) {
        if (this._board[row][col] === null) {
          player = null;
          streak = 0;
          continue;
        }

        if (player === null || this._board[row][col]!.token !== player) {
          player = this._board[row][col]!.token;
          streak = 1;
          continue;
        } else {
          player = this._board[row][col]!.token;
          streak += 1;
        }

        if (streak === WIN_STREAK) {
          return player;
        }
      }

      player = null;
      streak = 0;
    }

    // Diagonal
    for (let row = 0; row < NUM_ROWS; row++) {
      for (let col = 0; col < NUM_COLS; col++) {
        if (this._board[row][col] === null) {
          continue;
        }

        player = this._board[row][col]!.token;

        // Top-left to bottom-right
        streak = 1;
        for (let d = 1; d < WIN_STREAK && isValidCoord(col - d, row - d); d++) {
          if (
            this._board[row - d][col - d] === null ||
            this._board[row - d][col - d]!.token !== player
          ) {
            break;
          }

          streak += 1;

          if (streak === WIN_STREAK) {
            return player;
          }
        }

        // Top-right to bottom-left
        streak = 1;
        for (let d = 1; d < WIN_STREAK && isValidCoord(col + d, row - d); d++) {
          if (
            this._board[row - d][col + d] === null ||
            this._board[row - d][col + d]!.token !== player
          ) {
            break;
          }

          streak += 1;

          if (streak === WIN_STREAK) {
            return player;
          }
        }
      }
    }

    if (Game._tokenCount === NUM_COLS * NUM_ROWS) {
      return 'draw';
    }

    return null;
  }

  placeInColumn(column: number) {
    const placeCoords = this.findNearestEmptyCell(column);

    if (!placeCoords) {
      throw new Error('Cannot place a token in a full column.');
    }

    const [col, row] = placeCoords;
    this._board[row][col] = {
      id: Game._tokenCount++,
      col,
      row,
      token: this._currentPlayer,
    };

    this._currentPlayer = this._currentPlayer === 'red' ? 'yellow' : 'red';

    return this._board[row][col]!;
  }

  rotateBoard(direction: RotationDirection) {
    this._rotation += direction === RotationDirection.LEFT ? -90 : 90;

    for (let colNum = 0; colNum < this.columnCount; colNum++) {
      // Pull down the cells in each column relative to the current rotation.
      search: for (const [col1, row1] of this.iterateColumnInReverse(colNum)) {
        // Skip cells with grounded tokens already.
        if (this._board[row1][col1] !== null) {
          continue;
        }

        // If has blank space, find a cell with a non-grounded token.
        let col2: number = col1;
        let row2: number = row1;

        while (true) {
          [col2, row2] = this.goUpColumn(col2, row2);

          if (col2 < 0 || col2 >= NUM_COLS || row2 < 0 || row2 >= NUM_ROWS) {
            break;
          }

          if (this._board[row2][col2] === null) {
            continue;
          }

          this._board[row1][col1] = this._board[row2][col2];
          this._board[row1][col1]!.col = col1;
          this._board[row1][col1]!.row = row1;

          this._board[row2][col2] = null;

          continue search;
        }

        // Traversed all the way up and can't find any more tokens:
        break;
      }
    }

    this._currentPlayer = this._currentPlayer === 'red' ? 'yellow' : 'red';

    return this._board.flatMap(row =>
      row.filter(cell => !!cell),
    ) as PlacedToken[];
  }
}
