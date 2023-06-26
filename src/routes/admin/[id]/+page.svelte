<script lang="ts">
    import { create, type Session } from '$lib/waku'
	import { onMount } from 'svelte';
    import { page } from '$app/stores'
    import { messages } from '$lib/stores/messages'

    let session: Session | undefined

    onMount(async () => {
        const id = $page.params.id
        session = await create({ privateKeyHex: id, onUpdate(_messages) {
            $messages = _messages
        }})
    })
</script>

<h1>Welcome to AskLive</h1>
{#if session}
    <p>Secret: {session.secretHex}</p>
{/if}
<ul>
    {#each Object.entries($messages) as [id, message]}
        <li>{id} {message.message} {message.vote}</li>
    {/each}
</ul>
