import type { Node } from '../../types/nodes.d.ts'
import GeneratorState from './state.ts'
import ConstantPool from '../shared/constant-pool.ts'
import error from '../shared/error.ts'

export default class Generator {
    private state: GeneratorState;
    private constantPool: ConstantPool;

    constructor(state: GeneratorState) {
        this.state = state
        this.constantPool = new ConstantPool()
    }

    generate() {
        
        while (!this.state.isAtEnd()) {
            this.generateStatement(this.state.peek())
            this.state.increment()
        }

        return this.state.getBytecode()
    }

    getConstantPool() {
        return this.constantPool
    }

    private generateStatement(node: Node) {
        switch (node?.type) {
            case 'PrintStatement': {
                this.generatePrintStatement(node)
                break
            } case 'VariableDeclaration': {
                this.generateVariableDeclaration(node)
                break
            } case 'BlockStatement': {
                this.generateBlockStatement(node)
                break
            } case 'IfStatement': {
                this.generateIfStatement(node)
                break
            } default: {
                this.generateExpression(node)
            }
        }
    } 

    private generateBlockStatement(node: Node) {
        let cursor: number = 0

        while (node.body[cursor]) {
            this.generateStatement(node.body[cursor])
            cursor++
        }
    }

    private generateIfStatement(node: Node) {        
        this.generateExpression(node.condition)
        
        this.state.push(14) // JumpIfFalse
        
        // Store current length for future use of indexing
        const jmpIfFalseIdx = this.state.length()
        this.state.push(-1) // Means patch it later

        this.generateStatement(node.consequent)

        

        if (node.alternate) {
            this.state.push(15) // Jump
            const jmpIdx = this.state.length()
            this.state.push(-1)

            // Skip consequent instruction execution if stack.pop() is false, and directly jump to the end of if statement
            this.state.update(jmpIfFalseIdx, this.state.length()) 

            this.generateStatement(node.alternate)

            // Set jumping index to the current length of array because stack top was true, so we skip executing the else branch
            this.state.update(jmpIdx, this.state.length())
        } else {
            this.state.update(jmpIfFalseIdx, this.state.length())
        }
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
        switch (node?.type) {
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
            } case 'ComparisonExpression': {
                this.generateExpression(node.left)
                this.generateExpression(node.right)

                switch (node.operator) {
                    case '>': {
                        this.state.push(16)
                        break
                    } case '<': {
                        this.state.push(17)
                        break
                    } case '>=': {
                        this.state.push(18)
                        break
                    } case '<=': {
                        this.state.push(19)
                        break
                    } case '==': {
                        this.state.push(20)
                        break
                    } case '!=': {
                        this.state.push(21)
                        break
                    }
                }
            }  case 'UnaryExpression': {
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
            } case 'AssignmentExpression': {
                if (node.left.type !== 'Identifier') {
                    error(`Expected identifier name, got ${node.left.type}`)
                }

                const varIdx = this.constantPool.store(node.left.name)
                this.generateExpression(node.right)
                this.state.push(13)
                this.state.push(varIdx)
                break
            } case 'NumberLiteral': {
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