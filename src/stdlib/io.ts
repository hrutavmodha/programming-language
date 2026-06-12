import { stdout } from 'process'
import { openSync, readSync } from 'fs'

export function print(args: any) {
    stdout.write(args + '\n')
}

export function input(prompt: string) {
    stdout.write(prompt)

    const buffer = Buffer.alloc(1024)
    const fd = openSync('/dev/tty', 'rs')
    const bytesRead = readSync(fd, buffer, 0, 1024, null)

    return buffer.toString('utf8', 0, bytesRead).trim()
}