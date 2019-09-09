import '@vechain/connex'
import {SimpleWallet} from '@vechain/connex.driver-nodejs'

declare global {
    namespace NodeJS {
        interface Global {
            connex: Connex
            wallet: SimpleWallet
        }
    }
}
