<script lang="ts">
  import { onMount } from 'svelte';
  import type { PeerError } from 'peerjs';

  import GameScreen from './components/GameScreen.svelte';
  import JoinModal from './components/JoinModal.svelte';
  import StartModal from './components/StartModal.svelte';
  import { getHostId, removeUrlParams } from './connection/joinLink';
  import { peerClient, peerHost } from './connection/peerObjects';
  import { peerIsReady } from './connection/peer';

  import './connection/gameHosting';

  let modalToShow: 'join' | 'start' | null = 'join';

  onMount(() => {
    const hostId = getHostId();
    removeUrlParams();

    if (hostId) {
      peerIsReady().then(() => peerClient.connectToHost(hostId));
      modalToShow = 'start';
    } else {
      peerHost.acceptIncoming = true;
    }

    peerClient.on('disconnect', handleDisconnect);
    peerClient.on('self_error', handleError);
    peerClient.on('host_error', handleError);

    peerClient.onMessage('game_start', handleGameStart);
    peerClient.onMessage('unexpected_disconnect', handleDisconnect);
  });

  function handleGameEnd() {
    peerHost.acceptIncoming = true;
    modalToShow = 'join';
  }

  function handleGameStart() {
    peerHost.acceptIncoming = false;
    modalToShow = null;
  }

  function handleDisconnect() {
    alert('Oh no! A disconnection occured.');
    handleGameEnd();
  }

  function handleError(err?: PeerError<string>) {
    if (err?.type === 'peer-unavailable') {
      alert('The host that we are trying to connect to no longer exists...');
    } else {
      alert("Oh no! An unknown error occured. The game can't continue.");
      console.error(err, err?.type);

      // todo: attempt reconnect
    }

    handleGameEnd();
  }
</script>

<div class="flex h-screen w-screen items-center justify-center bg-gray-300">
  <GameScreen on:endactionsdone={handleGameEnd} />

  {#if modalToShow === 'join'}
    <JoinModal />
  {:else if modalToShow === 'start'}
    <StartModal />
  {/if}
</div>
