<script lang="ts">
	import { goto } from '$app/navigation';
	import Logo from '$lib/components/logo.svelte';
	import routes from '$lib/routes';
	import { generateRandomKey } from '$lib/waku';

	let sessionId = '';

	function startSession() {
		const id = generateRandomKey();
		goto(routes.ADMIN(id));
	}

	function joinSession() {
		// TODO validate sessionId
		console.debug('joinSession', { sessionId });
		const id = sessionId;
		goto(routes.SESSION(id));
	}
</script>

<center>
    <div class="centered"><a href="/"><Logo size={96}></Logo></a></div>

    <p class="centered"></p>

	<button on:click={startSession}>Start new session</button>

	<p>or</p>

    <form>
        <input type="text" bind:value={sessionId} placeholder="Enter session id here"/>
        <button on:click={joinSession}>Join session</button>    
    </form>
</center>

<style>
    .centered {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    input {
        padding: 0.5em;
        flex: 0.4;
    }
    button {
        padding: 0.5em;
        margin-left: 0.5em;
        flex: 0.1;
    }
    form {
        display: flex;
        margin: 0.5em;
        justify-content: center;
    }

</style>