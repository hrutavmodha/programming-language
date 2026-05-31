import type { Node } from '../../types/nodes.d.ts'
import GeneratorState from './state.ts'
import ConstantPool from '../shared/constant-pool.ts'

export default class Generator {
    private state: GeneratorState;
    private constantPool: ConstantPool;

    constructor(state: GeneratorState) {
        this.state = state
        this.constantPool = new ConstantPool()
    }

    generate() {
        this.state.getAst().body.forEach((node: Node) => {
            switch (node.type) {
                case 'PrintStatement': {
                    this.generatePrintStatement(node)
                    break
                } case 'VariableDeclaration': {
                    this.generateVariableDeclaration(node)
                    break
                } default: {
                    this.generateExpression(node)
                }
            }
        })

        return this.state.getBytecode()
    }

    getConstantPool() {
        return this.constantPool
    }

    private generateVariableDeclaration(node: Node) {
        if (node.value !== null) {
            this.generateExpression(node.value)
        } else {
            this.state.push(10)
        }
        const nameIdx = this.constantPool.store(node.name)
        this.state.push(11)
        this.state.push(nameIdx)
    }

    private generatePrintStatement(node: Node) {
        this.generateExpression(node.arguments)
        this.state.push(7)
    }

    private generateExpression(node: Node) {
        switch (node.type) {
            case 'ArithmeticExpression': {
                this.generateExpression(node.left)
                this.generateExpression(node.right)

                switch (node.operator) {
                    case '+': {
                        this.state.push(1)
                        break
                    } case '-': {
                        this.state.push(2)
                        break
                    } case '*': {
                        this.state.push(3)
                        break
                    } case '/': {
                        this.state.push(4)
                        break
                    } case '%': {
                        this.state.push(5)
                        break
                    }
                }
                break
            } case 'UnaryExpression': {
                this.generateExpression(node.operand)

                switch (node.operator) {
                    case '-': {
                        this.state.push(8)
                        break
                    } case '!': {
                        this.state.push(9)
                        break
                    }
                } 
                break
            }
            case 'NumberLiteral': {
                const cpIdx = this.constantPool.store(Number(node.value))
                this.state.push(6)
                this.state.push(cpIdx)
                break
            } case 'BooleanLiteral': {
                let value: boolean
                if (node.value === 'true') {
                    value = true
                } else if (node.value === 'false') {
                    value = false
                }
                const cpIdx = this.constantPool.store(value!)
                this.state.push(6)
                this.state.push(cpIdx)
                break
            } case 'StringLiteral': {
                const cpIdx = this.constantPool.store(String(node.value))
                this.state.push(6)
                this.state.push(cpIdx)
                break
            } case 'Identifier': {
                const cpIdx = this.constantPool.store(node.name)
                this.state.push(12)
                this.state.push(cpIdx)
                break
            }
        }
    }
}