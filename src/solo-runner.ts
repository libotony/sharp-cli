// tslint:disable:max-line-length
import { spawn, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'
import * as fs from 'fs'
const debug = require('debug')('sharp:runner:solo')

export class SoloRunner extends EventEmitter {
    private child: ChildProcess|null = null
    private path: string
    private port: number
    private exited = false

    constructor(path: string, port = 8668) {
        super()

        if (port > 65535 || port < 0) {
            throw new Error('invalid port number')
        }
        this.port = port
        fs.accessSync(path, fs.constants.F_OK | fs.constants.X_OK)
        this.path = path

    }

    public start() {
        this.child = spawn(this.path, ['solo', '--on-demand', '--api-addr', '127.0.0.1:' + this.port], { stdio: ['ignore', 'pipe', 'pipe'] })

        this.child.on('exit', (code, signal) => {
            this.exited = true
            this.emit('exit')
        })

        this.child.stderr!.on('data', (msg: Buffer) => {
            debug(msg.toString().trim())
        })

        this.child.stdout!.on('data', (msg) => {
            debug(msg.toString().trim())
        })

        // 'Can not be spawned' error emitted by event other than synchronously
        return new Promise((resolve, reject) => {
            const child = this.child!

            const onError = (e: Error) => {
                detachEvents()
                return reject(e)
            }
            const onStdout = (data: Buffer) => {
                detachEvents()
                if (data.toString().startsWith('Starting Thor solo')) {
                    child.on('error', (e) => {
                        debug('running solo node error', e)
                    })
                    return resolve()
                } else {
                    return reject(new Error('Failed to start solo node: ' + data.toString().trim()))
                }
            }

            const detachEvents = () => {
                child.removeListener('error', onError)
                child!.stdout!.removeListener('data', onStdout)
            }

            child.once('error', onError)
            child.stdout!.once('data', onStdout)
        })
    }

    public close() {
        return new Promise((resolve) => {
            if (this.exited) {
                return resolve()
            }

            this.child!.on('close', () => {
                resolve()
            })
            this.child!.kill('SIGTERM')
        })
    }

    get Exited() {
        return this.exited
    }
}
