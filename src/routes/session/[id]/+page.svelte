<script lang="ts">
	import {
		join,
		post,
		vote,
		type Session,
		type MessageContainer,
		type PostMessage
	} from '$lib/waku';
	import { onDestroy, onMount } from 'svelte';
	import { page } from '$app/stores';
	import { fly } from 'svelte/transition';
    import copy from 'copy-to-clipboard';
	import Logo from '$lib/components/logo.svelte';

    const secretHex = $page.params.id;

	let session: Session | undefined;
	let question = '';
	let askDisabled = false;
	let voteDisabled = false;
	let messages: (PostMessage & { id: string })[] = [];
    let selectedId: string | undefined

	onMount(async () => {
		session = await join(secretHex, {
			onUpdate(_messages) {
				messages = sortedMessages(_messages);
                console.debug({ messages })
			},
            onMessage(message, id) {
                console.debug({ message, id })
            }
		});
		messages = sortedMessages(session.messages);
        console.debug({ messages })
	});

	onDestroy(() => {
		if (session) {
			session.unsubscribe();
		}
	});

	async function ask() {
		if (session) {
			askDisabled = true;
			await post(session.secretHex, question, session.waku);
			question = '';
			askDisabled = false;
		}
	}

	async function onVote(id: string) {
		if (session) {
			voteDisabled = true;
			await vote(secretHex, id, session.waku);
			voteDisabled = false;
		}
	}

    function onKeyup(e: KeyboardEvent) {
        if (e.key === 'Enter') {
            ask()
        }
    }

    function onMouseEnter(id: string) {
        selectedId = id
    }

    function onMouseLeave() {
        selectedId = undefined
    }

	function sortedMessages(messageContainer: MessageContainer) {
		return Object.entries(messageContainer)
			.map((entry) => ({ ...entry[1], id: entry[0] }))
            .filter(message => message.removed !== true)
			.sort((a, b) => b.vote - a.vote);
	}
</script>

<div class="centered"><a href="/"><Logo size={96}></Logo></a></div>

{#if session}
	<ol>
		{#each messages as message}
			<li 
                transition:fly={{ y: 40, duration: 700 }}
                on:mouseenter={() => onMouseEnter(message.id)}
                on:mouseleave={() => onMouseLeave()}
            >
                <span class="circle">{message.vote}</span>
				{message.message}
				{#if selectedId === message.id }
                    <div class="buttons">
                        <button 
                            on:click={() => onVote(message.id)} 
                            disabled={voteDisabled}
                        >Vote</button>
                        <button 
                            on:click={() => copy(message.id)} 
                            disabled={voteDisabled}
                        >Copy ID</button>
                    </div>
				{/if}
			</li>
		{/each}
	</ol>
{:else}
	<p>Loading...</p>
{/if}

{#if session}
    <form>
        <input 
            bind:value={question} 
            on:keyup={onKeyup} 
            disabled={askDisabled} 
            placeholder="Type your question here"
        />
        <button on:click={ask} disabled={askDisabled}>Ask</button>    
    </form>
{/if}

<style lang="scss">
    .centered {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    input {
        padding: 0.5em;
        flex: 0.9;
    }
    button {
        padding: 0.5em;
        margin-left: 0.5em;
        flex: 0.1;
        white-space: nowrap;
    }
    form {
        display: flex;
        margin: 0.5em;
    }
    ol {
        padding: 0;
    }
    li {
        margin: 0.5em;
        padding: 0.5em;
        background-color:whitesmoke;
        list-style: none;
        display: flex;
        align-items: center;
        position: relative;
    }
    .circle {
        font-size: 1rem;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 1.5em; 
        height: 1.5em;
        border-radius: 50%;
        margin: 0.5em;
        font-weight: bold;
        background-color: salmon;
        color: white;
    }
    .buttons {
        display: flex;
        position: absolute;
        top: 0.25em;
        right: 0;
        padding: 0.5em;
        z-index: 1;
    }
</style>
