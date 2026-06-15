import { writeFileSync, unlinkSync } from 'fs'

export function createFile(path: string): void {
    writeFileSync(path, '')
}

export function writeFile(path: string, content: string): void {
    writeFileSync(path, content)
}

export function deleteFile(path: string): void {
    unlinkSync(path)
}
