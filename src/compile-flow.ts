import * as path from 'path'
import * as fs from 'fs'
import { sync as mkdirp } from 'mkdirp'
import { compile, getSolidityCompiler } from 'sharp-compile'
const debug = require('debug')('sharp:compile-flow')

export interface CompileFlowOptions {
    contractsDirectory: string,
    contracts: string[],
    buildDirectory: string,
    solc: {
        version: string
    }
}

export const makeOptions = (options: {
    contracts_directory?: string;
    build_directory?: string;
    contracts?: string[];
    solc?: {
        version?: string
    };
}): CompileFlowOptions => {
    let contractsDirectory
    let buildDirectory
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

    if (!options.contracts || !Array.isArray(options.contracts) || options.contracts.length === 0) {
        throw new Error('options: contracts entry needed')
    }
    for (const c of options.contracts) {
        if (typeof c !== 'string') {
            throw new Error('options.contracts: entry should be string')
        }
        fs.accessSync(path.join(contractsDirectory, c), fs.constants.R_OK)
    }

    const solc = {
        version: ''
    }
    if (options.solc && options.solc.version && typeof options.solc.version === 'string') {
        solc.version = options.solc.version
    }

    const o =  {
        contractsDirectory,
        contracts: options.contracts,
        buildDirectory,
        solc
    }
    debug('option:', o)

    return o
}

export const compileFlow = async (options: CompileFlowOptions) => {
    process.stderr.write('Preparing compiler......\n')
    const solc = await getSolidityCompiler(options.solc.version)
    const contractsDirectory = options.contractsDirectory
    const buildDirectory = options.buildDirectory

    process.stderr.write('Compiling contracts......\n')
    for (const file of options.contracts) {
        const output = compile(solc, file, contractsDirectory)

        let warning = ''
        if (output.errors && output.errors.length) {
            for (const e of output.errors) {
                if (e.type === 'Warning') {
                    warning += e.formattedMessage
                } else {
                    throw new Error(e.formattedMessage)
                }
            }
        }

        if (!!warning) {
            const head = '\n==============WARNING=================\n\n'
            const tail = '\n\n=======================================\n'
            process.stderr.write(head + warning.replace(/\n$/, '') + tail)
        }

        process.stderr.write('Saving contracts meta......\n')

        // FileName
        for (const [_, fileMeta] of Object.entries(output.contracts)) {
            // ContractName
            for (const [contractName, contractMeta] of Object.entries(fileMeta)) {
                const fd = fs.openSync(path.join(buildDirectory, contractName + '.json'), 'w')
                const info = {
                    contractName,
                    abi: contractMeta.abi,
                    metadata: contractMeta.metadata,
                    bytecode: contractMeta.evm.bytecode.object,
                    deployedBytecode: contractMeta.evm.deployedBytecode.object,
                    sourceMap: contractMeta.evm.bytecode.sourceMap,
                    deployedSourceMap: contractMeta.evm.deployedBytecode.sourceMap,
                    compiler: {
                        name: 'solc',
                        version: solc.version()
                    },
                    devdoc: contractMeta.devdoc,
                    userdoc: contractMeta.userdoc,
                    updatedAt: (new Date()).toISOString()
                }
                fs.writeSync(fd, JSON.stringify(info, null, 4), null, 'utf-8')
                fs.closeSync(fd)
            }
        }
        process.stderr.write(`All done! Saved to ${buildDirectory}\n`)
   }
}
