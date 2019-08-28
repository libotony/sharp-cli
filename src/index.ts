#!/usr/bin/env node
import * as yargs from 'yargs'

import { startTest } from './test-runner'

const args = yargs
    .scriptName('sharp-cli')
    .command({
        command: 'compile [filename]',
        describe: 'compile contracts',
        builder: (thisYargs) => thisYargs.demandOption('filename'),
        handler: (argv) => {
            console.log(argv)
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
