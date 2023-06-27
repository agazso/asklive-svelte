import { createLightNode, waitForRemotePeer, createEncoder, createDecoder } from '@waku/sdk';
import * as utils from '@waku/sdk';
import type { LightNode, IDecodedMessage, StoreQueryOptions } from '@waku/interfaces';
import { multiaddr } from '@multiformats/multiaddr';
import * as secp from '@noble/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { Protocols } from '@waku/interfaces';

type QueryResult = AsyncGenerator<Promise<IDecodedMessage | undefined>[]>;

const peerMultiaddr = multiaddr(
	'/dns4/ws.waku-1.apyos.dev/tcp/443/wss/p2p/16Uiu2HAm8gXHntr3SB5sde11pavjptaoiqyvwoX3GyEZWKMPiuBu'
);

const topicApp = 'wote-app';
const topicVersion = 1;

export function getTopic(contentTopic: string) {
	return `/${topicApp}/${topicVersion}/${contentTopic}`;
}

async function connectWaku() {
	const waku = await createLightNode({ pingKeepAlive: 30 });
	await waku.start();
	await waku.dial(peerMultiaddr);
	await waitForRemotePeer(waku, [Protocols.Filter, Protocols.LightPush, Protocols.Store]);

	return waku;
}

function decodeMessagePayload(wakuMessage: IDecodedMessage) {
	return utils.bytesToUtf8(wakuMessage.payload);
}

async function subscribe(
	waku: LightNode,
	topic: string,
	callback: (decodedMessage: IDecodedMessage) => void
) {
	const contentTopic = getTopic(topic);
	const messageDecoder = createDecoder(contentTopic);
	const unsubscribe = await waku.filter.subscribe([messageDecoder], callback);

	return unsubscribe;
}

async function send(waku: LightNode, topic: string, message: unknown) {
	const json = JSON.stringify(message);
	const payload = utils.utf8ToBytes(json);
	const contentTopic = getTopic(topic);
	const encoder = createEncoder({ contentTopic });

	return await waku.lightPush.send(encoder, { payload });
}

interface CallbackOptions {
	onMessage?: (message: Message, id: string) => void;
	onUpdate?: (messages: MessageContainer) => void;
}

interface Options extends CallbackOptions {
	privateKeyHex?: string;
}

export interface Session {
	secretHex: string;
	topicHex: string;

	messages: MessageContainer;

	waku: LightNode;
	unsubscribe: () => void | Promise<void>;
}

export interface AdminSession extends Session {
	privateKeyHex: string;
	publicKeyHex: string;
	adminSecretHex: string;
	adminTopicHex: string;
}

export function generateRandomKey() {
	return secp.etc.bytesToHex(secp.utils.randomPrivateKey());
}

export async function create(options: Options | undefined = undefined): Promise<AdminSession> {
	const privateKeyHex = options?.privateKeyHex;
	const privateKey = privateKeyHex
		? secp.etc.hexToBytes(privateKeyHex)
		: secp.utils.randomPrivateKey();
	const publicKey = secp.getPublicKey(privateKey);
	const secret = sha256(publicKey);
	const topic = sha256(secret);

	console.log({
		privateKey: secp.etc.bytesToHex(privateKey),
		publicKey: secp.etc.bytesToHex(publicKey),
		secret: secp.etc.bytesToHex(secret),
		topic: secp.etc.bytesToHex(topic)
	});

	return await admin(secp.etc.bytesToHex(privateKey), { ...options });
}

export interface PostMessage {
	type: 'post';
	message: string;
	vote: number;
    removed?: true
}

interface VoteMessage {
	type: 'vote';
	id: string;
}

interface RemoveMessage {
    type: 'remove'
    id: string;
}

type Message = PostMessage | VoteMessage | RemoveMessage;

export interface MessageContainer {
	[key: string]: PostMessage;
}

function handleMessage(message: Message, id: string, messages: MessageContainer) {
	switch (message.type) {
		case 'post': {
			if (!messages[id]) {
				messages[id] = {
					...message,
					vote: 0
				};
			}
			return;
		}
		case 'vote': {
			if (messages[message.id]) {
				const oldMessage = messages[message.id];
				messages[message.id] = {
					...oldMessage,
					vote: oldMessage.vote + 1
				};
			}
            return
		}
        case 'remove':
            if (messages[message.id]) {
				const oldMessage = messages[message.id];
				messages[message.id] = {
					...oldMessage,
					removed: true,
				};
			}
            return
	}
}

function displayMessages(messages: MessageContainer) {
	console.log(messages);
}

export async function admin(
	privateKeyHex: string,
	options: CallbackOptions | undefined = undefined
): Promise<AdminSession> {
	const privateKey = secp.etc.hexToBytes(privateKeyHex);
	const publicKey = secp.getPublicKey(privateKey);
	const secret = sha256(publicKey);
	const topic = sha256(secret);

	const adminSecret = sha256(privateKey);
	const adminTopic = sha256(adminSecret);

	console.log({
		adminSecret: secp.etc.bytesToHex(adminSecret),
		adminTopic: secp.etc.bytesToHex(adminTopic)
	});

	const waku = await connectWaku();

	const messages: MessageContainer = {};

	const results = await readStore(waku, secp.etc.bytesToHex(topic));
	const readMessages = await parseQueryResults(results);
	readMessages.forEach((jsonMessage) => {
		const id = secp.etc.bytesToHex(sha256(jsonMessage));
		const message = JSON.parse(jsonMessage) as Message;
        console.log(message, id, messages)
		handleMessage(message, id, messages);
	});

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const unsubscribeTopic = await subscribe(waku, secp.etc.bytesToHex(topic), (payload) => {
		const messageJSON = decodeMessagePayload(payload);
		const id = secp.etc.bytesToHex(sha256(messageJSON));
		const message = JSON.parse(messageJSON);

		handleMessage(message, id, messages);
		if (options?.onMessage) {
			options.onMessage(message, id);
		}
		displayMessages(messages);
		if (options?.onUpdate) {
			options.onUpdate(messages);
		}
	});

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const unsubscribeAdminTopic = await subscribe(
		waku,
		secp.etc.bytesToHex(adminTopic),
		(payload) => {
			const messageJSON = decodeMessagePayload(payload);
			const adminMessage = JSON.parse(messageJSON);
			console.debug({ adminMessage });
		}
	);

	return {
		waku,

		messages,

		privateKeyHex,
		publicKeyHex: secp.etc.bytesToHex(publicKey),
		secretHex: secp.etc.bytesToHex(secret),
		topicHex: secp.etc.bytesToHex(topic),

		adminSecretHex: secp.etc.bytesToHex(adminSecret),
		adminTopicHex: secp.etc.bytesToHex(adminTopic),

		unsubscribe: async () => {
			await unsubscribeTopic();
			await unsubscribeAdminTopic();
		}
	};
}

export async function join(
	secretHex: string,
	options: CallbackOptions | undefined = undefined
): Promise<Session> {
	const secret = secp.etc.hexToBytes(secretHex);
	const topic = sha256(secret);

	const waku = await connectWaku();

	const messages: MessageContainer = {};

	const results = await readStore(waku, secp.etc.bytesToHex(topic));
	const readMessages = await parseQueryResults(results);
	readMessages.forEach((jsonMessage) => {
		const id = secp.etc.bytesToHex(sha256(jsonMessage));
		const message = JSON.parse(jsonMessage) as PostMessage;
		handleMessage(message, id, messages);
	});

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const unsubscribeTopic = await subscribe(waku, secp.etc.bytesToHex(topic), (payload) => {
		const messageJSON = decodeMessagePayload(payload);
		const id = secp.etc.bytesToHex(sha256(messageJSON));
		const message = JSON.parse(messageJSON);

		handleMessage(message, id, messages);
		if (options?.onMessage) {
			options.onMessage(message, id);
		}
		displayMessages(messages);
		if (options?.onUpdate) {
			options.onUpdate(messages);
		}
	});

	return {
		waku,

		messages,

		secretHex: secp.etc.bytesToHex(secret),
		topicHex: secp.etc.bytesToHex(topic),

		unsubscribe: () => unsubscribeTopic()
	};
}

export async function post(
	secretHex: string,
	message: string,
	waku: LightNode | undefined = undefined
) {
	const secret = secp.etc.hexToBytes(secretHex);
	const topic = sha256(secret);
	const topicHex = secp.etc.bytesToHex(topic);

	const data = {
		type: 'post',
		message
	};

	waku = waku || (await connectWaku());
	await send(waku, topicHex, data);
}

export async function vote(secretHex: string, id: string, waku: LightNode | undefined = undefined) {
	const secret = secp.etc.hexToBytes(secretHex);
	const topic = sha256(secret);
	const topicHex = secp.etc.bytesToHex(topic);

	const data = {
		type: 'vote',
		id
	};

	waku = waku || (await connectWaku());
	await send(waku, topicHex, data);
}

export async function remove(secretHex: string, id: string, waku: LightNode | undefined = undefined) {
	const secret = secp.etc.hexToBytes(secretHex);
	const topic = sha256(secret);
	const topicHex = secp.etc.bytesToHex(topic);

	const data = {
		type: 'remove',
		id
	};

	waku = waku || (await connectWaku());
	await send(waku, topicHex, data);
}

export async function parseQueryResults(results: QueryResult): Promise<string[]> {
	const stringResults: string[] = [];
	for await (const messagePromises of results) {
		for (const messagePromise of messagePromises) {
			const message = await messagePromise;
			if (message) {
				const decodedPayload = decodeMessagePayload(message);
				stringResults.push(decodedPayload);
			}
		}
	}
	return stringResults;
}

export async function readStore(
	waku: LightNode,
	contentTopic: string,
	storeQueryOptions?: StoreQueryOptions
): Promise<QueryResult> {
	const topic = getTopic(contentTopic);
	const decoder = createDecoder(topic);
	return waku.store.queryGenerator([decoder], storeQueryOptions);
}
