#!/usr/bin/env node
import * as yargs from 'yargs'

import { startTest } from './test-runner'
import { compileFlow, makeOptions } from './compile-flow'
import { execScript } from './exec-script'
const debug = require('debug')('sharp:cli')

const args = yargs
    .scriptName('sharp-cli')
    .pkgConf('sharp')
    .command<{filename: string, [index: string]: any}>({
        command: 'compile',
        describe: 'compile contracts',
        builder: (thisYargs: any) => thisYargs,
        handler: (argv) => {
            (async () => {
                const options = makeOptions(argv as any)
                await compileFlow(options)
            })().catch(e => {
                debug('compile flow failed', e)
                const head = '\n===============ERROR===================\n\n'
                const tail = '\n\n=======================================\n'
                process.stderr.write(head + e.message + tail)
                yargs.exit(-1, new Error('Compile failed'))
            })
        }
    })
    .command<{ task: string; port: number}>({
        command: 'test [task]',
        describe: 'run test task',
        builder: (thisYargs: any) => {
            return thisYargs
                .option({
                    task: {
                        type: 'string',
                        describe: 'npm script to run for the test',
                        default: 'sharp'
                    }
                })
                .option({
                    port: {
                        type: 'number',
                        describe: 'port of solo node\'s api',
                        default: 8668
                    }
                })
        },
        handler: (argv) => {
            startTest(argv.task, argv.port)
        }
    })
    .command<{ file: string; endpoint: string; }>({
        command: 'exec [file]',
        describe: 'execute a connex script',
        builder: (thisYargs: any) => {
            return thisYargs
                .demandOption('file')
                .option({
                    endpoint: {
                        type: 'string',
                        describe: 'thor node\'s api endpoint',
                        default: 'http://localhost:8669'
                    }
                })
        },
        handler: (argv) => {
            execScript(argv.file, argv.endpoint)
                .then(() => {
                    // just want to do a successfully exit
                    yargs.exit(0, null!)
                })
                .catch(e => {
                    debug('compile flow failed', e)
                    const head = '\n===============ERROR===================\n\n'
                    const tail = '\n\n=======================================\n'
                    process.stderr.write(head + e.message + tail)
                    yargs.exit(-1, new Error('Execute script failed'))
                })
        }
    })
    .demandCommand(1, 'You need at least one command before moving on')
    .help()
    .alias('h', 'help')
    .alias('v', 'version')
    .argv
