#!/usr/bin/env node
import * as yargs from 'yargs'

import { startTest } from './test-runner'
import { compileFlow, makeOptions } from './compile-flow'
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
    .demandCommand(1, 'You need at least one command before moving on')
    .help()
    .alias('h', 'help')
    .alias('v', 'version')
    .argv
