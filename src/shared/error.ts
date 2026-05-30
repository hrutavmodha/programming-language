import { exit } from 'process'

export default function error(msg: string): void {
    console.error(msg)
    exit(1)
}