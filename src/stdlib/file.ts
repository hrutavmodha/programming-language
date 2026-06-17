import { writeFileSync, unlinkSync, readFileSync, appendFileSync, existsSync } from 'fs'
import error from '../shared/error.ts'

export function createFile(path: string): void {
    writeFileSync(path, '')
}

export function writeFile(path: string, content: string): void {
    writeFileSync(path, content)
}

export function deleteFile(path: string): void {
    if (!existsSync(path)) {
        error(`File not found "${path}"`)
    }

    unlinkSync(path)
}

export function readFile(path: string): string {
    if (!existsSync(path)) {
        error(`File not found "${path}"`)
    }

    return readFileSync(path).toString()
}

export function appendFile(path: string, content: string): void {
    appendFileSync(path, content)
}
