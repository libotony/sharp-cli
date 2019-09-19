import * as fs from 'fs'
import * as path from 'path'
import { sync as mkdirp } from 'mkdirp'
import { SolcOptions } from '@libotony/sharp-compile'
const debug = require('debug')('sharp:compile-options')

export interface CompileFlowOptions {
    contractsDirectory: string,
    contracts: string[],
    buildDirectory: string,
    solcVer: string,
    solc: SolcOptions
}

// link optimizer's settings to solidity's doc
// {
//     enabled: boolean,
//     runs: number,
//         details: {
//         peephole: boolean,
//         jumpdestRemover: boolean,
//         orderLiterals: boolean,
//         deduplicate: boolean,
//         cse: boolean,
//         constantOptimizer: boolean,
//         yul: boolean,
//         yulDetails: {
//             stackAllocation: boolean
//         }
//     }
// }

// tslint:disable-next-line:max-line-length
const supportedEvmVersion = ['homestead', 'tangerineWhistle', 'spuriousDragon', 'byzantium', 'constantinople', 'petersburg']

export const normalizeOptions = (options: {
    contracts_directory?: string;
    build_directory?: string;
    contracts?: string[];
    solc?: {
        version?: string
    } & SolcOptions;
}): CompileFlowOptions => {
    let contractsDirectory
    let buildDirectory

    // contracts dir
    if (options.contracts_directory) {
        if (path.isAbsolute(options.contracts_directory)) {
            contractsDirectory = options.contracts_directory
        } else {
            contractsDirectory = path.join(process.cwd(), options.contracts_directory)
        }
    } else {
        contractsDirectory = path.join(process.cwd(), './contracts')
    }
    fs.readdirSync(contractsDirectory)

    // build dir
    if (options.build_directory) {
        if (path.isAbsolute(options.build_directory)) {
            buildDirectory = options.build_directory
        } else {
            buildDirectory = path.join(process.cwd(), options.build_directory)
        }
    } else {
        buildDirectory = path.join(process.cwd(), './build')
    }
    mkdirp(buildDirectory)

    // contracts
    if (!options.contracts || !Array.isArray(options.contracts) || options.contracts.length === 0) {
        throw new Error('options: contracts entry needed')
    }
    for (const c of options.contracts) {
        if (typeof c !== 'string') {
            throw new Error('options.contracts: entry should be string')
        }
        fs.accessSync(path.join(contractsDirectory, c), fs.constants.R_OK)
    }

    let solcVer = ''
    const solc: SolcOptions = {}

    if (options.solc) {
        const s = options.solc

        if (s.version && typeof s.version === 'string') {
            solcVer = s.version
        }

        if (s.evmVersion) {
            if (supportedEvmVersion.indexOf(s.evmVersion) === -1) {
                throw new Error('unsupported evm version: ' + s.evmVersion)
            }
            solc.evmVersion = s.evmVersion
        }

        if (s.libraries) {
            for (const [_, libs] of Object.entries(s.libraries)) {
                for (const [name, addr] of Object.entries(libs)) {
                    if (typeof name !== 'string') {
                        throw new Error('invalid library name: ' + name)
                    }
                    if (typeof addr !== 'string' || !/^0x[0-9a-fA-F]{40}$/i.test(addr)) {
                        throw new Error('invalid library address: ' + addr)
                    }
                }
            }
            solc.libraries = s.libraries
        }

        if (s.optimizer) {
            solc.optimizer = s.optimizer
        }
    }

    const o = {
        contractsDirectory,
        contracts: options.contracts,
        buildDirectory,
        solcVer,
        solc
    }
    debug('option:', JSON.stringify(o, null, 2))

    return o
}
