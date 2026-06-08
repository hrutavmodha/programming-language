import type { Node } from '../../types/nodes.d.ts'
import GeneratorState from './state.ts'
import ConstantPool from '../shared/constant-pool.ts'
import LoopContextStack from './loop-context.ts'
import error from '../shared/error.ts'

export default class Generator {
    private state: GeneratorState;
    private constantPool: ConstantPool;
    private loopContextStack: LoopContextStack;

    constructor(state: GeneratorState) {
        this.state = state
        this.constantPool = new ConstantPool()
        this.loopContextStack = new LoopContextStack()
    }

    generate() {
        this.state.push(22)

        while (!this.state.isAtEnd()) {
            this.generateStatement(this.state.peek())
            this.state.increment()
        }
        this.state.push(23)

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
            } case 'ConstantDeclaration': {
                this.generateConstantDeclaration(node)
                break
            } case 'BlockStatement': {
                this.generateBlockStatement(node)
                break
            } case 'WhileStatement': {
                this.generateWhileStatement(node)
                break
            } case 'ForStatement': {
                this.generateForStatement(node)
                break
            } case 'DoWhileStatement': {
                this.generateDoWhileStatement(node)
                break
            } case 'BreakStatement': {
                this.generateBreakStatement()
                break
            } case 'ContinueStatement': {
                this.generateContinueStatement()
                break
            } case 'IfStatement': {
                this.generateIfStatement(node)
                break
            } default: {
                this.generateExpression(node)
            }
        }
    } 

    private generateWhileStatement(node: Node) {
        const startIdx = this.state.length()
        
        this.generateExpression(node.condition)

        this.state.push(14)
        const jmpIfFalseIdx = this.state.length()
        this.state.push(-1)

        /* Push to stack before generating body so that if body contains BreakStatement or 
        ContinueStatement, it can easily get context and append placeholders before
        generating instructions for VM */
        this.loopContextStack.push({
            continuePatchPoints: [],
            breakPatchPoints: []
        })

        this.generateStatement(node.body)

        this.state.push(15)
        this.state.push(startIdx)

        const loopContext = this.loopContextStack.peek()

        loopContext.breakPatchPoints.forEach((breakPoint: number) => {
            this.state.update(breakPoint, this.state.length())
        })

        loopContext.continuePatchPoints.forEach((continuePoint: number) => {
            this.state.update(continuePoint, startIdx)
        })

        this.state.update(jmpIfFalseIdx, this.state.length())
    } 

    private generateBlockStatement(node: Node) {
        let cursor: number = 0

        this.state.push(22) // Enter Scope

        while (node.body[cursor]) {
            this.generateStatement(node.body[cursor])
            cursor++
        }

        this.state.push(23) // Exit Scope
    }

    private generateBreakStatement() {
        const context = this.loopContextStack.peek()
        
        if (!context) {
            error(`Cannot break outside the loop`)
        }

        this.state.push(15) // Jump
        const jmpIdx = this.state.length()
        this.state.push(-1)

        context.breakPatchPoints.push(jmpIdx)
    }

    private generateContinueStatement() {
        const context = this.loopContextStack.peek()
        
        if (!context) {
            error(`Cannot continue outside the loop`)
        }

        this.state.push(15) // Jump
        const jmpIdx = this.state.length()
        this.state.push(-1)

        context.continuePatchPoints.push(jmpIdx)
    }

    private generateForStatement(node: Node) {
        this.state.push(22) // Enter Scope

        this.generateStatement(node.initializer)
        const jmpIdx = this.state.length()
        this.generateExpression(node.condition)
        
        this.state.push(14)
        const jmpIfFalseIdx = this.state.length()
        this.state.push(-1)
        
        this.loopContextStack.push({
            continuePatchPoints: [],
            breakPatchPoints: []
        })
        
        this.generateStatement(node.body)

        const continueIdx = this.state.length()
        this.generateStatement(node.update)

        this.state.push(15)
        this.state.push(jmpIdx)
        
        this.state.update(jmpIfFalseIdx, this.state.length())

        const loopContext = this.loopContextStack.peek()
        loopContext.breakPatchPoints.forEach((breakPoint: number) => {
            this.state.update(breakPoint, this.state.length())
        })
        loopContext.continuePatchPoints.forEach((continuePoint: number) => {
            this.state.update(continuePoint, continueIdx)
        })

        this.state.push(23) // Exit Scope
    } 

    private generateDoWhileStatement(node: Node) {
        const startIdx = this.state.length()
        
        this.loopContextStack.push({
            continuePatchPoints: [],
            breakPatchPoints: []
        })
        
        this.generateStatement(node.body)
        const conditionIdx = this.state.length()
        this.generateExpression(node.condition)


        this.state.push(9) // Not

        this.state.push(14) // Jump If False
        this.state.push(startIdx)

        const loopContext = this.loopContextStack.peek()
        loopContext.breakPatchPoints.forEach((breakPoint: number) => {
            this.state.update(breakPoint, this.state.length())
        })
        loopContext.continuePatchPoints.forEach((continuePatch: number) => {
            this.state.update(continuePatch, conditionIdx)
        })
    }

    private generateIfStatement(node: Node) {        
        this.generateExpression(node.condition)
        
        this.state.push(14) // JumpIfFalse
        
        // Store current length for future use of indexing
        const jmpIfFalseIdx = this.state.length()
        this.state.push(-1) // To patch it later

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

    private generateConstantDeclaration(node: Node) {
        if (node.value !== null) {
            this.generateExpression(node.value)
        } else {
            this.state.push(10)
        }
        const nameIdx = this.constantPool.store(node.name)
        this.state.push(25)
        this.state.push(nameIdx)
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
                this.state.push(24) // Pop
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