<script>
  import { onMount } from 'svelte';

  import { peerClient } from '../connection/peerObjects';
  import { peerIsReady } from '../connection/peer';

  let isReady = false;

  onMount(async () => {
    await peerIsReady();
    await peerClient.isConnected();

    isReady = true;
  });

  async function signalGameStartToHost() {
    peerClient.sendToHost('game_start_signal');
  }
</script>

<div class="z-20 bg-stone-500">
  <h1>Connecturn 4</h1>

  <button
    class="bg-slate-400"
    disabled={!isReady}
    on:click={signalGameStartToHost}
  >
    Click the start the game!
  </button>
</div>
