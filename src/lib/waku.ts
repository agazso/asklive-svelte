import { 
    createLightNode, 	
    // waitForRemotePeer,
    // createEncoder,
	// createDecoder,
 } from '@waku/sdk'
// import * as utils from '@waku/sdk'
// import type { LightNode, IDecodedMessage } from '@waku/interfaces'
// import { multiaddr } from '@multiformats/multiaddr'
// import * as secp from '@noble/secp256k1';
// import { sha256 } from '@noble/hashes/sha256'
// import { Protocols } from '@waku/interfaces';

// // node.js 18 and earlier requires globalThis.crypto polyfill.
// import { webcrypto } from 'node:crypto';
// // @ts-ignore
// if (!globalThis.crypto) globalThis.crypto = webcrypto;


// const peerMultiaddr = multiaddr(
// 	'/dns4/ws.waku.apyos.dev/tcp/443/wss/p2p/16Uiu2HAm5wH4dPAV6zDfrBHkWt9Wu9iiXT4ehHdUArDUbEevzmBY',
// )

// const topicApp = 'wote-app'
// const topicVersion = 1

// export function getTopic(contentTopic: string) {
// 	return `/${topicApp}/${topicVersion}/${contentTopic}`
// }

// async function connectWaku() {
// 	const waku = await createLightNode({ pingKeepAlive: 30 })
// 	await waku.start()
// 	await waku.dial(peerMultiaddr)
// 	await waitForRemotePeer(waku, [Protocols.Filter, Protocols.LightPush, Protocols.Store])

// 	return waku
// }

// function decodeMessagePayload(wakuMessage: IDecodedMessage) {
// 	return utils.bytesToUtf8(wakuMessage.payload)
// }

// async function subscribe(waku: LightNode, topic: string, callback: (decodedMessage: IDecodedMessage) => void) {
//     const contentTopic = getTopic(topic)
// 	const messageDecoder = createDecoder(contentTopic)
// 	const unsubscribe = await waku.filter.subscribe([messageDecoder], callback)

// 	return unsubscribe
// }

// async function send(waku: LightNode, topic: string, message: unknown) {
// 	const json = JSON.stringify(message)
// 	const payload = utils.utf8ToBytes(json)
// 	const contentTopic = getTopic(topic)
// 	const encoder = createEncoder({ contentTopic })

// 	return await waku.lightPush.send(encoder, { payload })
// }


export async function create() {
    // const privateKey = secp.utils.randomPrivateKey()
    // const publicKey = secp.getPublicKey(privateKey)
    // const secret = sha256(publicKey)
    // const topic = sha256(secret)

    // console.log({ 
    //     privateKey: secp.etc.bytesToHex(privateKey), 
    //     publicKey: secp.etc.bytesToHex(publicKey),
    //     secret: secp.etc.bytesToHex(secret),
    //     topic: secp.etc.bytesToHex(topic),
    // })

    // await admin(secp.etc.bytesToHex(privateKey))
}

interface PostMessage {
    type: 'post'
    message: string
    vote: number
}

interface VoteMessage {
    type: 'vote'
    id: string
}

type Message = PostMessage | VoteMessage

interface MessageContainer {
    [key: string]: PostMessage
}

function handleMessage(message: Message, id: string, messages: MessageContainer) {
    switch (message.type) {
        case 'post': {

            if (!messages[id]) {
                messages[id] = {
                    ...message,
                    vote: 0,
                }    
            }
            return
        }
        case 'vote': {
            if (messages[message.id]) {
                const oldMessage = messages[message.id]
                messages[message.id] = {
                    ...oldMessage,
                    vote: oldMessage.vote + 1,
                }
            }
        }
    }
}

function displayMessages(messages: MessageContainer) {
    console.log(messages)
}

// export async function admin(privateKeyHex: string) {
//     const privateKey = secp.etc.hexToBytes(privateKeyHex)
//     const publicKey = secp.getPublicKey(privateKey)
//     const secret = sha256(publicKey)
//     const topic = sha256(secret)

//     const adminSecret = sha256(privateKey)
//     const adminTopic = sha256(adminSecret)

//     console.log({ 
//         adminSecret: secp.etc.bytesToHex(adminSecret),
//         adminTopic: secp.etc.bytesToHex(adminTopic),
//     })

//     const waku = await connectWaku()

//     const messages: MessageContainer = {}

//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     const unsubscribeTopic = await subscribe(waku, secp.etc.bytesToHex(topic), (payload) => {
//         const messageJSON = decodeMessagePayload(payload)
//         const id = secp.etc.bytesToHex(sha256(messageJSON))
//         const message = JSON.parse(messageJSON)

//         handleMessage(message, id, messages)
//         displayMessages(messages)
//     })

//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     const unsubscribeAdminTopic = await subscribe(waku, secp.etc.bytesToHex(adminTopic), (payload) => {
//         const messageJSON = decodeMessagePayload(payload)
//         const adminMessage = JSON.parse(messageJSON)
//         console.debug({ adminMessage })        
//     })
// }

// export async function post(secretHex: string, message: string) {
//     const secret = secp.etc.hexToBytes(secretHex)
//     const topic = sha256(secret)
//     const topicHex = secp.etc.bytesToHex(topic)

//     const data = {
//         type: 'post',
//         message,
//     }

//     const waku = await connectWaku()
//     await send(waku, topicHex, data)
// }

// export async function vote(secretHex: string, id: string) {
//     const secret = secp.etc.hexToBytes(secretHex)
//     const topic = sha256(secret)
//     const topicHex = secp.etc.bytesToHex(topic)

//     const data = {
//         type: 'vote',
//         id,
//     }

//     const waku = await connectWaku()
//     await send(waku, topicHex, data)
// }

// async function main() {
//     const command = process.argv[2]
//     const restArgs = process.argv.slice(3)
//     switch (command) {
//         case 'create': return await create(...restArgs)
//         case 'admin': return await admin(...restArgs)
//         case 'post': return await post(...restArgs)
//         case 'vote': return await vote(...restArgs)
//         default: console.error(`unknonw command: ${command}`)
//     }
// }

// main().catch(console.error)