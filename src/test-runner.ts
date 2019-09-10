import { spawn } from 'child_process'
import * as path from 'path'
const debug = require('debug')('sharp:runner:task')
import { SoloRunner } from './solo-runner'

const getSolo = () => {
    const getPlatform = () => {
        // to be supported
        // linux
        // win32
        switch (process.platform) {
            case 'darwin':
            case 'linux':
                return process.platform
            case 'win32':
                return 'windows'
            default:
                throw new Error(`unsupported platform ${process.platform}!`)
        }
    }

    const getArch = () => {
        switch (process.arch) {
            case 'x64':
                return 'amd64'
            default:
                throw new Error(`unsupported arch ${process.arch}!`)
        }
    }

    const fName = `thor-${getPlatform()}-${getArch()}`

    return fName
}

export const startTest = async (taskName: string, soloPort: number) => {
    const fName = getSolo()
    const solo = new SoloRunner(path.join(__dirname, '../thor-bin/', fName), soloPort)

    await solo.start()

    debug('running task:', taskName)
    const child = spawn('npm', ['run', taskName], {
        cwd: process.cwd(),
        stdio: 'inherit',
        env: {
            ...process.env,
            THOR_REST: 'http://127.0.0.1:' + soloPort
        }
    })

    return await new Promise<number>((resolve) => {
        child.on('exit', (code, signal) => {
            debug(`child exited with code: ${code}, signal: ${signal}`)
            solo.close()
            resolve(code === null ? 0 : code )
        })
    })
}
