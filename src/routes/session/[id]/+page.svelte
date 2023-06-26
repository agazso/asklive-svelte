<script lang="ts">
    import { join, post, vote, type Session, type MessageContainer, type PostMessage } from '$lib/waku'
	import { onDestroy, onMount } from 'svelte';
    import { page } from '$app/stores'
    import { fly } from 'svelte/transition';

    let session: Session | undefined
    let question = ''
    let askDisabled = false
    let voteDisabled = false
    const secretHex = $page.params.id
    let messages: (PostMessage & { id: string })[] = []

    onMount(async () => {
        session = await join(secretHex, { onUpdate(_messages) {
            messages = sortedMessages(_messages)
        }})
        messages = sortedMessages(session.messages)
    })

    onDestroy(() => {
        if (session) {
            session.unsubscribe()
        }
    })

    async function ask() {
        if (session) {
            askDisabled = true
            await post(session.secretHex, question, session.waku)
            question = ''
            askDisabled = false
        }
    }

    async function onVote(id: string) {
        if (session) {
            voteDisabled = true
            await vote(secretHex, id, session.waku)
            voteDisabled = false
        }

    }

    function sortedMessages(messageContainer: MessageContainer) {
        return Object.entries(messageContainer).map(entry => ({ ...entry[1], id: entry[0] })).sort((a, b) => b.vote - a.vote)
    }
</script>

<h1>Welcome to AskLive</h1>
{#if session}
    <p>Secret: {session.secretHex}</p>
    <ul transition:fly={{ y: 40, duration: 2000 }}>
        {#each messages as message}
            <li transition:fly={{ y: 40, duration: 2000 }}><code>{message.id}</code> {message.message} 
                {#if message.vote === 0}
                    <button on:click={() => onVote(message.id)} disabled={voteDisabled}>Vote</button>
                {:else}
                    {message.vote}
                {/if}
            </li>
        {/each}
    </ul>
{:else}
    <p>Loading...</p>
{/if}
{#if session}
    <input bind:value={question}/>
    <button on:click={ask} disabled={askDisabled}>Ask</button>
{/if}

<style lang="scss">
    code {
        font-size: xx-small;
    }
</style>