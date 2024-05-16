<script>
  import { onMount } from 'svelte';

  import { peer, peerIsReady } from '../connection/peer';
  import { getJoinLink } from '../connection/joinLink';

  let joinLink = '';

  onMount(async () => {
    await peerIsReady();
    joinLink = getJoinLink(peer.id);
  });

  function copyJoinLink() {
    navigator.clipboard.writeText(joinLink);
  }
</script>

<div class="z-20 bg-stone-500">
  <h1>Connecturn 4</h1>

  <label for="joinLink">Join Link:</label>
  <input
    class="bg-slate-200"
    disabled={!joinLink}
    id="joinLink"
    type="text"
    readonly
    value={joinLink}
  />
  <button class="bg-slate-400" disabled={!joinLink} on:click={copyJoinLink}>
    Copy
  </button>
</div>
