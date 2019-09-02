import * as fs from 'fs'
import * as path from 'path'
import { Framework } from '@vechain/connex-framework'
import { Driver, SimpleWallet, SimpleNet } from '@vechain/connex.driver-nodejs'

interface Global extends NodeJS.Global {
    connex: Connex
}

declare var global: Global

export const execScript = async (file: string, endpoint: string) => {
    const filePath = path.join(process.cwd(), file)

    try {
        fs.accessSync(filePath, fs.constants.F_OK | fs.constants.R_OK)

        const wallet = new SimpleWallet()
        const driver = await Driver.connect(new SimpleNet(endpoint), wallet)
        const connex = new Framework(Framework.guardDriver(driver))

        global.connex = connex
    } catch (e) {
        throw new Error('Prepare failed: ' + e.message)
    }

    const con = await import(filePath)
    if (typeof con === 'function') {
        await con()
    } else if (typeof con.default === 'function') {
        await con.default()
    } else {
        throw new Error('Cannot locate the task in the script')
    }
}
