import * as fs from 'fs'
import * as path from 'path'
import { Framework } from '@vechain/connex-framework'
import { Driver, SimpleWallet, SimpleNet } from '@vechain/connex.driver-nodejs'
const debug = require('debug')('sharp:exec')

const networks: { [index: string]: string } = {
    '0x00000000851caf3cfdb6e899cf5958bfb1ac3413d346d43539627e6be7ec1b4a': 'Mainnet',
    '0x000000000b2bce3c70bc649a02749e8687721b09ed2e15997f466536b20bb127': 'Testnet',
    '0x00000000973ceb7f343a58b08f0693d6701a5fd354ff73d7058af3fba222aea4': 'Solo'
}

export const execScript = async (file: string, endpoint: string, requires: string[]) => {
    const filePath = path.join(process.cwd(), file)

    try {
        fs.accessSync(filePath, fs.constants.F_OK | fs.constants.R_OK)

        for (const r of requires) {
            let mPath = r
            if (fs.existsSync(path.resolve(mPath)) || fs.existsSync(path.resolve(`${mPath}.js`))) {
                mPath = path.resolve(mPath)
                debug(`resolved ${r} to ${mPath}`)
            }
            require(mPath)
            debug('loaded require: ', mPath)
        }

        debug('prepare connex env')
        const wallet = new SimpleWallet()
        const driver = await Driver.connect(new SimpleNet(endpoint), wallet)
        const connex = new Framework(Framework.guardDriver(driver))

        global.connex = connex
        global.wallet = wallet
    } catch (e) {
        throw new Error('Prepare failed: ' + e.message)
    }

    debug('execute script')

    const printNetInfo = () => {
        const geneID = global.connex.thor.genesis.id
        const netName = networks[geneID] ? networks[geneID] : 'UnKnown'

        process.stderr.write(`Connected to ${netName}(#0....${geneID.substr(-8)}) @ ${endpoint}`)
        process.stderr.write('\n')
    }

    process.env.THOR_REST = endpoint
    const con = await import(filePath)
    if (typeof con === 'function') {
        debug('module.exports = function')
        printNetInfo()
        await con()
    } else if (typeof con.default === 'function') {
        debug('export default function')
        printNetInfo()
        await con.default()
    } else {
        throw new Error('Cannot locate the task in the script')
    }
    debug('execute finished')
}
