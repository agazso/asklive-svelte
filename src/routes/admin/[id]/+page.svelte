<script lang="ts">
	import { create, remove, type MessageContainer, type PostMessage, type Session } from '$lib/waku';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import routes from '$lib/routes';
	import { goto } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import { fly } from 'svelte/transition';
	import copy from 'copy-to-clipboard';
	import Logo from '$lib/components/logo.svelte';

	let session: Session | undefined;
	let messages: (PostMessage & { id: string })[] = [];
	let selectedId: string | undefined;

	$: removedMessages = messages.filter((message) => message.removed === true);

	onMount(async () => {
		const id = $page.params.id;
		session = await create({
			privateKeyHex: id,
			onUpdate(_messages) {
				messages = sortedMessages(_messages);
			}
		});
		messages = sortedMessages(session.messages);
	});

	onDestroy(() => {
		if (session) {
			session.unsubscribe();
		}
	});

	function join() {
		if (session) {
			goto(routes.SESSION(session.secretHex));
		}
	}

	function onRemove(id: string) {
		if (session) {
			remove(session.secretHex, id, session.waku);
		}
	}

	function onMouseEnter(id: string) {
		selectedId = id;
	}

	function onMouseLeave() {
		selectedId = undefined;
	}

	function sortedMessages(messageContainer: MessageContainer) {
		return Object.entries(messageContainer)
			.map((entry) => ({ ...entry[1], id: entry[0] }))
			.sort((a, b) => b.vote - a.vote);
	}
</script>

<div class="centered"><a href="/"><Logo size={96} /></a></div>

{#if session}
	<section>
		Secret: {session.secretHex}
		<button on:click={join}>Join</button>
	</section>
{/if}

{#if session}
	<ol>
		{#each messages as message}
			{#if message.removed !== true}
				<li
					transition:fly={{ y: 40, duration: 700 }}
					on:mouseenter={() => onMouseEnter(message.id)}
					on:mouseleave={() => onMouseLeave()}
				>
					<span class="circle">{message.vote}</span>
					{message.message}
					{#if selectedId === message.id}
						<div class="buttons">
							<button on:click={() => onRemove(message.id)}>Remove</button>
							<button on:click={() => copy(message.id)}>Copy ID</button>
						</div>
					{/if}
				</li>
			{/if}
		{/each}
	</ol>
	{#if removedMessages.length > 0}
		<section>Removed messages:</section>
	{/if}
	<ol>
		{#each removedMessages as message}
			<li
				transition:fly={{ y: 40, duration: 2000 }}
				on:mouseenter={() => onMouseEnter(message.id)}
				on:mouseleave={() => onMouseLeave()}
			>
				<span class="circle">{message.vote}</span>
				{message.message}
				{#if selectedId === message.id}
					<div class="buttons">
						<button on:click={() => copy(message.id)}>Copy ID</button>
					</div>
				{/if}
			</li>
		{/each}
	</ol>
{:else}
	<p>Loading...</p>
{/if}

<style>
	.centered {
		display: flex;
		align-items: center;
		justify-content: center;
	}
	section {
		margin: 0.5em;
	}
	button {
		padding: 0.5em;
		margin-left: 0.5em;
		flex: 0.1;
		white-space: nowrap;
	}
	ol {
		padding: 0;
	}
	li {
		margin: 0.5em;
		padding: 0.5em;
		background-color: whitesmoke;
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
