import { writable } from 'svelte/store';
import type { MessageContainer } from '$lib/waku';

export const messages = writable<MessageContainer>({});
