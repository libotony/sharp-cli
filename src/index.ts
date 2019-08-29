#!/usr/bin/env node
import * as yargs from 'yargs'

import { startTest } from './test-runner'
import { compileFlow } from './compile-flow'

const args = yargs
    .scriptName('sharp-cli')
    .command<{filename: string}>({
        command: 'compile [filename]',
        describe: 'compile contracts',
        builder: (thisYargs: any) => thisYargs.demandOption('filename'),
        handler: (argv) => {
            compileFlow([argv.filename]).catch(e => {
                const head = '\n===============ERROR===================\n\n'
                const tail = '\n\n=======================================\n'
                process.stderr.write(head + e.message + tail)
                process.exit(-1)
            })
        }
    })
    .command<{ task: string; port: number}>({
        command: 'test [task]',
        describe: 'npm script to run for the test',
        builder: (thisYargs: any) => {
            return thisYargs
                .demandOption('task')
                .option({
                    port: {
                        type: 'number',
                        describe: 'port of solo node\'s api',
                        default: 8669
                    }
                })
        },
        handler: (argv) => {
            startTest(argv.task, argv.port)
        }
    })
    .demandCommand(1, 'You need at least one command before moving on')
    .help()
    .argv
