import * as path from 'path'
import * as fs from 'fs'
import { compile, getSolidityCompiler } from '@libotony/sharp-compile'
import { CompileFlowOptions } from './compile-options'
import { normalizeHex, colors } from './utils'
const debug = require('debug')('sharp:compile-flow')

export const compileFlow = async (options: CompileFlowOptions) => {
    process.stderr.write('Preparing compiler......\n')
    const solc = await getSolidityCompiler(options.solcVer).catch((e: Error) => {
        return Promise.reject(new Error('failed to load compiler: ' + e.message))
    })
    const contractsDirectory = options.contractsDirectory
    const buildDirectory = options.buildDirectory

    process.stderr.write('Compiling contracts......\n')
    for (const file of options.contracts) {
        const output = compile(solc, { file, options: options.solc, contractsDirectory })

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
            const head = colors.waring('\n==============WARNING=================\n\n')
            const tail = colors.waring('\n\n=======================================\n')
            process.stderr.write(head + warning.replace(/\n$/, '') + tail)
        }

        const refs: string[] = []
        // FileName
        for (const [_, fileMeta] of Object.entries(output.contracts)) {
            // ContractName
            for (const [contractName, contractMeta] of Object.entries(fileMeta)) {
                const fd = fs.openSync(path.join(buildDirectory, contractName + '.json'), 'w')
                // Get all link references
                // {
                //     "name.sol": {
                //         "contractName": [ReferenceObject]
                //     }
                // }
                for (const [_ , references] of Object.entries(contractMeta.evm.bytecode.linkReferences)) {
                    for (const [r, _] of Object.entries(references as object)) {
                        refs.push(r)
                    }
                }
                const info = {
                    contractName,
                    abi: contractMeta.abi,
                    metadata: contractMeta.metadata,
                    bytecode: normalizeHex(contractMeta.evm.bytecode.object),
                    deployedBytecode: normalizeHex(contractMeta.evm.deployedBytecode.object),
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
        if (refs.length) {
            const head = colors.info('\n===========LINK REFERENCE==============\n\n')
            const tail = colors.info('\n\n=======================================\n')
            const tipStart = 'External libraries refound: \n\n    '
            const tipEnd = '\n\nSet libraries in options to link them.'
            process.stderr.write(head + tipStart + refs.join(', ') + tipEnd + tail)
        }
    }
    process.stderr.write(`All done! Saved to ${buildDirectory}\n`)
}
