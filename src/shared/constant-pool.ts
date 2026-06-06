export default class ConstantPool {
    private pool: Array<any> = []
    private cursor: number = 0

    store(value: string | boolean | number): number {
        for (let i = 0; i < this.cursor; i++) {
            if (value === this.pool[i]) {
                return i
            }
        }

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
