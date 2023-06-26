// run with npx ts-node --esm --experimental-specifier-resolution=node cli.ts

import { create, admin, post, vote } from './waku'

async function main() {
    const command = process.argv[2]
    const restArgs = process.argv.slice(3)
    switch (command) {
        case 'create': return await create({ privateKeyHex: restArgs[0] })
        case 'admin': return await admin(restArgs[0])
        case 'post': return await post(restArgs[0], restArgs[1])
        case 'vote': return await vote(restArgs[0], restArgs[1])
        default: console.error(`unknonw command: ${command}`)
    }
}

main().catch(console.error)