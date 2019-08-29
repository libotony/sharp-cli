import * as path from 'path'
import * as fs from 'fs'
import { sync as mkdirp } from 'mkdirp'
import { compile, getSolidityCompiler } from 'sharp-compile'

export const compileFlow = async (files: string[]) => {
    const solc = await getSolidityCompiler('^0.4.24')
    const buildDirectory = path.join(process.cwd(), './contracts')
    const distDirectory = path.join(process.cwd(), './outputs')

    process.stderr.write('Compiling contracts......\n')
    for (const file of files) {
        const output = compile(solc, file, buildDirectory)

        let warning = ''
        if (output.errors.length) {
            for (const e of output.errors) {
                if (e.type === 'Warning') {
                    warning += e.formattedMessage
                } else {
                    throw new Error(e.formattedMessage)
                }
            }
        }

        const head = '\n==============WARNING=================\n\n'
        const tail = '\n\n=======================================\n'

        process.stderr.write(head + warning.replace(/\n$/, '') + tail)

        mkdirp(distDirectory)
        process.stderr.write('Saving contracts meta......\n')
        // console.log(JSON.stringify(output.contracts, null, 4))

        // FileName
        for (const [_, fileMeta] of Object.entries(output.contracts)) {
            // ContractName
            for (const [contractName, contractMeta] of Object.entries(fileMeta)) {
                const fd = fs.openSync(path.join(distDirectory, contractName + '.json'), 'w')
                const info = {
                    contractName,
                    abi: contractMeta.abi,
                    metadata: contractMeta.metadata,
                    bytecode: contractMeta.evm.bytecode.object,
                    deployedBytecode: contractMeta.evm.deployedBytecode.object,
                    sourceMap: contractMeta.evm.bytecode.sourceMap,
                    deployedSourceMap: contractMeta.evm.deployedBytecode.sourceMap,
                    compiler: {
                        name: 'sloc',
                        version: solc.version()
                    },
                    devdoc: contractMeta.devdoc,
                    userdoc: contractMeta.userdoc,
                    updatedAt: (new Date()).toISOString()
                }
                fs.writeSync(fd, JSON.stringify(info, null, 4), null, 'utf-8')
            }
        }

   }
}
