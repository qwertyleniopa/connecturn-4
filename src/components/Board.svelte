<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  import { writable } from 'svelte/store';

  import {
    NUM_COLS,
    NUM_ROWS,
    type PlacedToken,
    type Player,
  } from '../game/Game';
  import { animate, rafAnimate } from './animation';

  export let enableActions: boolean;

  const placedTokens = writable<PlacedToken[]>([]);

  let rotation = 0;
  let baseRotation = 0;
  $: highlightTransform = getHighlightTransform(baseRotation);

  let placeOngoing = false;
  let rotationOngoing = false;

  $: allowActions = enableActions && !placeOngoing && !rotationOngoing;

  export function clear() {
    $placedTokens = [];
  }

  export async function placeToken(col: number, row: number, token: Player) {
    placeOngoing = true;

    const [initCol, initRow] = getInitialTokenPos(col, row);

    const placedToken: PlacedToken = {
      id: $placedTokens.length,
      col: initCol,
      row: initRow,
      token,
    };

    placedTokens.update(tokens => tokens.concat(placedToken));

    await animate({
      targets: placedToken,
      col,
      row,
      easing: 'easeInOutQuad',
      update() {
        placedTokens.update(tokens => tokens);
      },
    });

    placeOngoing = false;
  }

  export async function rotate(
    nextPlacedTokens: PlacedToken[],
    nextRotation: number,
  ) {
    rotationOngoing = true;

    const currRotation = { value: rotation };

    await animate({
      targets: currRotation,
      value: nextRotation,
      duration: 2000,
      easing: 'easeInOutQuad',
      update() {
        rotation = currRotation.value;
      },
    });

    baseRotation = rotation % 360;

    // TODO: There's probably a better way than sorting like this lol
    // $placedTokens.sort((a, b) => a.id - b.id);
    const sortedNextTokens = nextPlacedTokens.toSorted((a, b) => a.id - b.id);

    // await rafAnimate(stop => {

    // });

    // have next tokens here
    // assume initialtokens is sorted
    // new positions here

    // await magicfunc(stop, cb)
    // cb => update all positions using accel, when all done, stop

    // change

    // TODO: Remove the need to sort and that ugly JSON clone lol.
    const currT = { value: 0 };
    const initialTokens = JSON.parse(JSON.stringify($placedTokens)).toSorted(
      (a: PlacedToken, b: PlacedToken) => a.id - b.id,
    );

    await animate({
      targets: currT,
      value: 1,
      duration: 1000,
      easing: 'easeInOutQuad',
      update() {
        for (const [i, placedToken] of sortedNextTokens.entries()) {
          const { col: nCol, row: nRow } = placedToken;

          $placedTokens[i].col =
            initialTokens[i].col + currT.value * (nCol - initialTokens[i].col);
          $placedTokens[i].row =
            initialTokens[i].row + currT.value * (nRow - initialTokens[i].row);
        }
      },
    });

    rotationOngoing = false;
  }

  function getHighlightTransform(baseRotation: number) {
    const count: number =
      baseRotation === 0 || baseRotation === 180 || baseRotation === -180
        ? NUM_COLS
        : NUM_ROWS;

    const height: string =
      baseRotation === 0 || baseRotation === 180 || baseRotation === -180
        ? `calc(var(--cell-size) * ${NUM_ROWS})`
        : `calc(var(--cell-size) * ${NUM_COLS})`;

    let divTX: string = '0';
    let divTY: string = '0';

    switch (baseRotation) {
      case 0:
        break;

      case 90:
      case -270:
        divTY = `calc(var(--cell-size) * ${NUM_ROWS})`;
        break;

      case 180:
      case -180:
        divTX = `calc(var(--cell-size) * ${NUM_COLS})`;
        divTY = `calc(var(--cell-size) * ${NUM_ROWS})`;
        break;

      case 270:
      case -90:
        divTX = `calc(var(--cell-size) * ${NUM_COLS})`;
        break;

      default:
        throw new Error('Cannot operate on non-well-defined angle');
    }

    return {
      count,
      divTX,
      divTY,
      height,
    };
  }

  function getInitialTokenPos(col: number, row: number) {
    switch (baseRotation) {
      case 0:
        return [col, 0];

      case 90:
      case -270:
        return [0, row];

      case 180:
      case -180:
        return [col, NUM_ROWS];

      case 270:
      case -90:
        return [NUM_COLS, row];

      default:
        throw new Error('Cannot operate on non-well-defined angle');
    }
  }
</script>

<div class="board-container" style="--rotation: {rotation}deg;">
  <div class="board" style="--grid-cols: {NUM_COLS}; --grid-rows: {NUM_ROWS};">
    <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
    {#each [...Array(NUM_COLS * NUM_ROWS)] as _}
      <span class="cell"></span>
    {/each}

    {#each $placedTokens as { col: absX, row: absY, id, token } (id)}
      <span class="token {token}" style="--x: {absX}; --y: {absY};"></span>
    {/each}

    <div
      class="highlight-container"
      class:disabled={!allowActions}
      style="--tx: {highlightTransform.divTX}; --ty: {highlightTransform.divTY}; --rotation: {-rotation}deg;"
    >
      <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
      {#each [...Array(highlightTransform.count)] as _, colI}
        <button
          class="highlight opacity-50 hover:bg-red-300"
          style="--height: {highlightTransform.height}; --x: {colI};"
          on:click={() => allowActions && dispatch('columnclick', colI)}
        ></button>
      {/each}
    </div>
  </div>

  <div class="flex justify-between">
    <button
      class="h-10 w-10 bg-slate-500"
      disabled={!allowActions}
      on:click={() => allowActions && dispatch('rotateleft')}
    >
      ↪
    </button>
    <button
      class="h-10 w-10 bg-slate-500"
      disabled={!allowActions}
      on:click={() => allowActions && dispatch('rotateright')}
    >
      ↩
    </button>
  </div>
</div>

<style>
  :root {
    --board-col: #4058a2;
    --border-col: #4058a2;
    --cell-size: min(9vmin, 80px);
    --red-col: #de504e;
    --yellow-col: #e1d279;
  }

  .board-container {
    rotate: var(--rotation);
  }

  .board {
    width: fit-content;

    position: relative;

    display: grid;
    grid-template-columns: repeat(var(--grid-cols), auto);
    grid-template-rows: repeat(var(--grid-rows), auto);

    border: min(2vmin, 13px) solid var(--border-col);
  }

  .cell {
    width: var(--cell-size);
    height: var(--cell-size);

    z-index: 2;

    /* Offset hard boundaries a bit for smoothing. */
    background: radial-gradient(
      transparent,
      transparent 53%,
      var(--board-col) 56%
    );
  }

  .token {
    width: var(--cell-size);
    height: var(--cell-size);

    position: absolute;
    left: calc(var(--x) * var(--cell-size));
    top: calc(var(--y) * var(--cell-size));

    border-radius: 100%;
  }

  .token.red {
    background-color: var(--red-col);
  }

  .token.yellow {
    background-color: var(--yellow-col);
  }

  .highlight-container {
    position: absolute;
    z-index: 50;
    translate: var(--tx) var(--ty);
    rotate: var(--rotation);
  }

  .highlight-container.disabled {
    display: none;
  }

  .highlight {
    width: var(--cell-size);
    height: var(--height);

    position: absolute;
    left: calc(var(--x) * var(--cell-size));
  }

  /* .highlight:hover {
    background-color: blue;
  } */
</style>
