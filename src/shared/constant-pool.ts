export default class ConstantPool {
    private pool: Array<any> = []
    private cursor: number = 0

    store(value: string | boolean | number): number {
        this.pool[this.cursor] = value
        const index = this.cursor
        this.cursor++
        return index
    }

    get(index: number): any {
        return this.pool[index]
    }

    getPool(): Array<any> {
        return this.pool
    }
}
