<script lang="ts">
	import { goto } from "$app/navigation";
	import routes from "$lib/routes";
	import { generateRandomKey } from "$lib/waku";

    let sessionId = ''

    function startSession() {
        const id = generateRandomKey()
        goto(routes.ADMIN(id))
    }

    function joinSession() {
        // TODO validate sessionId
        console.debug('joinSession', { sessionId })
        const id = sessionId
        goto(routes.SESSION(id))
    }
</script>

<center>
    <h1>Welcome to AskLive</h1>

    <button on:click={startSession}>Start new session</button>

    <p>or</p>

    <input type="text" bind:value={sessionId}/>
    <button on:click={joinSession}>Join session</button>
</center>
