import { exit as processExit } from 'process';

export function getEnv(key: string): string | null {
    return process.env[key] || null;
}

export function getArg(index: number): string | null {
    // process.argv contains: [node_path, script_path, ...args]
    // index 0 of our language arguments corresponds to the third element (argv[2])
    return process.argv[index + 2] || null;
}

export function exit(code: number): void {
    processExit(code);
}
