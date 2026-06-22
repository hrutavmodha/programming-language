export function now(): number {
    return Date.now();
}

export function sleep(ms: number): void {
    // Synchronous sleep using Atomics.wait
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}
