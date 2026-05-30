import type { Node } from '../../types/nodes.d.ts';
import GeneratorState from './state.ts'

export default class Generator {
    private state: GeneratorState;

    constructor(state: GeneratorState) {
        this.state = state
    }

    generate() {
        this.state.getAst().body.forEach((node: Node) => {
            switch (node.type) {
                case 'PrintStatement': {
                    this.generatePrintStatement(node)
                    break
                }
                default: {
                    this.generateExpression(node)
                }
            }
        })

        return this.state.getBytecode()
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
                const cpIdx = this.state.storeLiteral(Number(node.value))
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
                const cpIdx = this.state.storeLiteral(value)
                this.state.push(6)
                this.state.push(cpIdx)
                break
            } case 'StringLiteral': {
                const cpIdx = this.state.storeLiteral(String(node.value))
                this.state.push(6)
                this.state.push(cpIdx)
                break
            }
        }
    }
}