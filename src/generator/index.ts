import type { Node } from '../../types/nodes.d.ts'
import GeneratorState from './state.ts'
import ConstantPool from '../shared/constant-pool.ts'
import LoopContextStack from './loop-context.ts'
import error from '../shared/error.ts'
import { nativeFunctions } from '../shared/native-functions.ts'

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
        // Custom Magic Number "HM"
        this.state.push(77)
        this.state.push(72)

        this.state.push(21)

        while (!this.state.isAtEnd()) {
            this.generateStatement(this.state.peek())
            this.state.increment()
        }
        this.state.push(22)

        return this.state.getBytecode()
    }

    getConstantPool() {
        return this.constantPool
    }

    private generateStatement(node: Node) {
        switch (node?.type) {
            case 'VariableDeclaration': {
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
            } case 'SwitchStatement': {
                this.generateSwitchStatement(node)
                break
            } case 'FunctionDeclaration': {
                this.generateFunctionDeclaration(node)
                break
            } case 'ReturnStatement': {
                this.generateReturnStatement(node)
                break
            } case 'ClassDeclaration': {
                this.generateClassDeclaration(node)
                break
            } default: {
                this.generateExpression(node)
                this.state.push(23) // Pop
            }
        }
    } 

    private generateClassDeclaration(node: Node) {
        this.state.push(33) // Define Class
        
        const cpIdx = this.constantPool.store(node.name.name)

        this.state.push(cpIdx)

        let props: Array<any> = []
        let methods: Array<any> = []

        node?.body?.forEach((element: any) => {
            switch (element.type) {
                case 'PropertyDeclaration':
                    props.push(element)
                    break
                case 'MethodDeclaration':
                    methods.push(element)
                    break
                default:
                    error(`Unsupport class entity type found: "${element.type}"`)
            
            }
        })

        this.state.push(props.length)
        this.state.push(methods.length)

        this.state.push(21)

        props.forEach((property: any) => {
            if (property.value !== null) {
                this.generateExpression(property.value)
            } else {
                this.state.push(9) // Push Null
            }

            const nameIdx = this.constantPool.store(property.name.name)
            this.state.push(37)
            this.state.push(nameIdx)

            /* First byte represents access specifier:
            1 ==== public
            0 ==== private */
            
            switch (property.accessModifier) {
                case 'public': {
                    this.state.push(1)
                    break
                } case 'private': {
                    this.state.push(0)
                    break
                } default: {
                    error(`Unknown access modifier "${property.accessModifier}" for property "${property.name.name}" of class "${node.name.name}"`)
                }
            }

            /* Second byte represents staticity of member 
                1 ==== static
                0 ==== not static
            */
            if (property.isStatic) {
                this.state.push(1)
            } else {
                this.state.push(0)
            }
        })

        methods.forEach((method: any) => {
            this.state.push(29)
            const cpIdx = this.constantPool.store(method.name.name)
            this.state.push(cpIdx)

            this.state.push(method.arguments.length)

            this.state.push(14)
            const jmpIdx = this.state.length()
            this.state.push(-1)

            this.state.push(21)

            method.arguments.slice().reverse().forEach((arg: any) => {
                this.state.push(10)
                const nameIdx = this.constantPool.store(arg?.name)
                this.state.push(nameIdx)
            })

            this.state.push(10)
            const thisIdx = this.constantPool.store('this')
            this.state.push(thisIdx)

            method.body.body.forEach((stmt: Node) => {
                this.generateStatement(stmt)
            })

            if (method.body.body[method.body.body.length - 1].type !== 'ReturnStatement') {
                this.generateReturnStatement({
                    type: 'ReturnStatement',
                    expression: undefined
                })
            }

            this.state.push(22)

            this.state.update(jmpIdx, this.state.length())
        })



        this.state.push(22)
    }

    private generateReturnStatement(node: Node) {
        this.generateExpression(node.expression)
        this.state.push(30) // Return
    }

    private generateFunctionDeclaration(node: Node) {
        this.state.push(29)
        const cpIdx = this.constantPool.store(node.name.name)
        this.state.push(cpIdx)

        this.state.push(node.arguments.length)

        this.state.push(14)
        const jmpIdx = this.state.length()
        this.state.push(-1)

        this.state.push(21)

        node.arguments.slice().reverse().forEach((arg: any) => {
            this.state.push(10)
            const nameIdx = this.constantPool.store(arg?.name)
            this.state.push(nameIdx)
        })

        node.body.body.forEach((stmt: Node) => {
            this.generateStatement(stmt)
        })

        if (node.body.body[node.body.body.length - 1].type !== 'ReturnStatement') {
            this.generateReturnStatement({
                type: 'ReturnStatement',
                expression: undefined
            })
        }

        this.state.push(22)

        this.state.update(jmpIdx, this.state.length())
    }

    private generateWhileStatement(node: Node) {
        const startIdx = this.state.length()
        
        this.generateExpression(node.condition)

        this.state.push(13)
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

        this.state.push(14)
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

        this.state.push(21) // Enter Scope

        while (node.body[cursor]) {
            this.generateStatement(node.body[cursor])
            cursor++
        }

        this.state.push(22) // Exit Scope
    }

    private generateBreakStatement() {
        const context = this.loopContextStack.peek()
        
        if (!context) {
            error(`Cannot break outside the loop`)
        }

        this.state.push(14) // Jump
        const jmpIdx = this.state.length()
        this.state.push(-1)

        context.breakPatchPoints.push(jmpIdx)
    }

    private generateContinueStatement() {
        const context = this.loopContextStack.peek()
        
        if (!context) {
            error(`Cannot continue outside the loop`)
        }

        this.state.push(14) // Jump
        const jmpIdx = this.state.length()
        this.state.push(-1)

        context.continuePatchPoints.push(jmpIdx)
    }

    private generateForStatement(node: Node) {
        this.state.push(21) // Enter Scope

        this.generateStatement(node.initializer)
        const jmpIdx = this.state.length()
        this.generateExpression(node.condition)
        
        this.state.push(13)
        const jmpIfFalseIdx = this.state.length()
        this.state.push(-1)
        
        this.loopContextStack.push({
            continuePatchPoints: [],
            breakPatchPoints: []
        })
        
        this.generateStatement(node.body)

        const continueIdx = this.state.length()
        this.generateStatement(node.update)

        this.state.push(14)
        this.state.push(jmpIdx)
        
        this.state.update(jmpIfFalseIdx, this.state.length())

        const loopContext = this.loopContextStack.peek()
        loopContext.breakPatchPoints.forEach((breakPoint: number) => {
            this.state.update(breakPoint, this.state.length())
        })
        loopContext.continuePatchPoints.forEach((continuePoint: number) => {
            this.state.update(continuePoint, continueIdx)
        })

        this.state.push(22) // Exit Scope
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


        this.state.push(8) // Not

        this.state.push(13) // Jump If False
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
        
        this.state.push(13) // JumpIfFalse
        
        // Store current length for future use of indexing
        const jmpIfFalseIdx = this.state.length()
        this.state.push(-1) // To patch it later

        this.generateStatement(node.consequent)

        if (node.alternate) {
            this.state.push(14) // Jump
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

    private generateSwitchStatement(node: Node) {
        this.generateExpression(node.discriminant)

        let patchIndexes: number[] = []
        
        for (let clause of node.cases) {
            this.state.push(26) // Duplicate

            if (clause.test !== null) {
                this.generateExpression(clause.test)
            }

            this.state.push(19) // Equals

            this.state.push(13) // Jump If False
            const jmpIfFalseIdx = this.state.length()
            this.state.push(-1)

            this.state.push(23)

            this.generateStatement(clause.consequent)

            this.state.push(14) // Jump
            patchIndexes.push(this.state.length())
            this.state.push(-1)

            this.state.update(jmpIfFalseIdx, this.state.length())
        }

        this.state.push(23)

        patchIndexes.forEach((idx: number) => {
            this.state.update(idx, this.state.length())
        })
    }

    private generateConstantDeclaration(node: Node) {
        if (node.value !== null) {
            this.generateExpression(node.value)
        } else {
            this.state.push(9)
        }
        const nameIdx = this.constantPool.store(node.name)
        this.state.push(24)
        this.state.push(nameIdx)
    }

    private generateVariableDeclaration(node: Node) {
        if (node.value !== null) {
            this.generateExpression(node.value)
        } else {
            this.state.push(9) // Push Null
        }
        const nameIdx = this.constantPool.store(node.name)
        this.state.push(10)
        this.state.push(nameIdx)
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
                        this.state.push(15)
                        break
                    } case '<': {
                        this.state.push(16)
                        break
                    } case '>=': {
                        this.state.push(17)
                        break
                    } case '<=': {
                        this.state.push(18)
                        break
                    } case '==': {
                        this.state.push(19)
                        break
                    } case '!=': {
                        this.state.push(20)
                        break
                    }
                }
                break
            } case 'LogicalExpression': {
                this.generateExpression(node.left)
                this.generateExpression(node.right)

                switch (node.operator) {
                    case '&': {
                        this.state.push(31)
                        break
                    } case '|': {
                        this.state.push(32)
                        break
                    }
                }
                break
            }  case 'UnaryExpression': {
                this.generateExpression(node.operand)

                switch (node.operator) {
                    case '-': {
                        this.state.push(7)
                        break
                    } case '!': {
                        this.state.push(8)
                        break
                    }
                } 
                break
            } case 'AssignmentExpression': {
                if (node.left.type === 'MemberExpression') {
                    this.generateExpression(node.left.object)
                    this.generateExpression(node.right)

                    this.state.push(36) // Set Prop
                    
                    const propIdx = this.constantPool.store(node.left.property.name)
                    
                    this.state.push(propIdx)
                } else if (node.left.type === 'Identifier') {
                    const varIdx = this.constantPool.store(node.left.name)
                    this.generateExpression(node.right)
                    this.state.push(12)
                    this.state.push(varIdx)
                } else {
                    error(`Expected identifier or member expression, got ${node.left.type}`)
                }
                break
            } case 'MemberExpression': {
                this.generateExpression(node.object)
                
                this.state.push(35) // Get Prop
                
                const propIdx = this.constantPool.store(node.property.name)

                this.state.push(propIdx)
                break
            } case 'CallExpression': {
                let isMethod: boolean = false
                
                node.arguments.forEach((arg: any) => {
                    this.generateExpression(arg)
                })

                if (node.callee.type === 'MemberExpression') {
                    isMethod = true
                    this.generateExpression(node.callee.object)
                    this.state.push(34)
                } else if (node.callee?.name in nativeFunctions) {
                    this.state.push(27) // Call Native
                } else {
                    this.state.push(28) // Call
                }

                let cpIdx = 0

                if (isMethod) {
                    cpIdx = this.constantPool.store(node.callee.property.name)
                } else {
                    cpIdx = this.constantPool.store(node.callee.name)
                }

                this.state.push(cpIdx)
                this.state.push(node.arguments.length)
                break
            } case 'ThisExpression': {
                this.state.push(11)
                const cpIdx = this.constantPool.store('this')
                this.state.push(cpIdx)
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
                this.state.push(11)
                this.state.push(cpIdx)
                break
            }
        }
    }
}