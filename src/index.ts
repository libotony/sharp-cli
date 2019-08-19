#!/usr/bin/env node
import { spawn } from 'child_process'
import * as path from 'path'
import * as yargs from 'yargs'
const debug = require('debug')('sharp:runner:task')
import { SoloRunner } from './solo-runner'

const argv = yargs
    .strict(true)
    .options({
        task: {
            type: 'string',
            default: 'sharp',
            describe: 'npm task for the test'
        },
        port: {
            type: 'number',
            default: 8668,
            describe: 'port of solo node\'s api'
        }
    }).argv

const bin = path.join(__dirname, '../bin/thor')
const solo = new SoloRunner(bin, argv.port)

solo.start()

debug('running task:', argv.task)
const child = spawn('npm', ['run', argv.task], {
    cwd: process.cwd(),
    stdio: 'inherit'
})

child.on('exit', (code, signal) => {
    debug(`child exited with code: ${code}, signal: ${signal}`)
    solo.close()
})
