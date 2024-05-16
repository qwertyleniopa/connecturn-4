<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  const dispatch = createEventDispatcher();

  import { peerClient } from '../connection/peerObjects';
  import Board from './Board.svelte';
  import {
    RotationDirection,
    type PlacedToken,
    type Player,
    type Winner,
  } from '../game/Game';

  let board: Board;

  let currentPlayer: Player;
  let selfPlayer: Player;
  let showAll = false;
  let winner: Winner = null;

  onMount(() => {
    peerClient.on('disconnect', handleError);
    peerClient.on('self_error', handleError);
    peerClient.on('host_error', handleError);

    peerClient.onMessage('game_start', handleGameStart);
    peerClient.onMessage('place_in_column', handlePlaceInColumn);
    peerClient.onMessage('rotate_board', handleBoardRotation);
    peerClient.onMessage('unexpected_disconnect', handleError);
  });

  function handleEndState(winnerPlayer: Winner) {
    winner = winnerPlayer;

    // TODO: wait for a bit
    dispatch('endactionsdone');
  }

  function handleError() {
    showAll = false;
    // TODO: replace with end game func
  }

  async function handleGameStart(currP: Player, selfP: Player) {
    // Reset previous state, if ever.
    winner = null;

    // Initialize current state.
    currentPlayer = currP;
    selfPlayer = selfP;

    // TODO: Animated show
    showAll = true;

    board?.clear();
  }

  async function handlePlaceInColumn(
    tokenCol: number,
    tokenRow: number,
    token: Player,
    nextPlayer: Player,
    winnerPlayer: Winner,
  ) {
    await board.placeToken(tokenCol, tokenRow, token);

    if (winnerPlayer !== null) {
      handleEndState(winnerPlayer);
      return;
    }

    currentPlayer = nextPlayer;
  }

  async function handleBoardRotation(
    nextPlacedTokens: PlacedToken[],
    nextRotation: number,
    nextPlayer: Player,
    winnerPlayer: Winner,
  ) {
    await board.rotate(nextPlacedTokens, nextRotation);

    if (winnerPlayer !== null) {
      handleEndState(winnerPlayer);
      return;
    }

    currentPlayer = nextPlayer;
  }

  function placeInColumn(column: number) {
    peerClient.sendToHost('place_in_column', column);
  }

  function rotateBoardLeft() {
    peerClient.sendToHost('rotate_board', RotationDirection.LEFT);
  }

  function rotateBoardRight() {
    peerClient.sendToHost('rotate_board', RotationDirection.RIGHT);
  }
</script>

{#if showAll}
  <div class="fixed h-screen w-screen">
    {#if !!winner}
      <p class="absolute left-1/2 top-0 -translate-x-1/2">{winner} wins!</p>
    {/if}

    <div
      class="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2"
    >
      <Board
        bind:this={board}
        enableActions={currentPlayer === selfPlayer && !winner}
        on:columnclick={({ detail: column }) => placeInColumn(column)}
        on:rotateleft={rotateBoardLeft}
        on:rotateright={rotateBoardRight}
      />
    </div>

    <p class="absolute bottom-0 left-1/2 -translate-x-1/2">
      It's {currentPlayer}'s turn! (You're {selfPlayer}.)
    </p>
  </div>
{/if}
