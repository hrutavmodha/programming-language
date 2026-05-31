import type { Node } from '../../types/nodes.d.ts'
import error from '../shared/error.ts'
import AnalyzerState from './state.ts'

export default class Analyzer {
    private state: AnalyzerState

    constructor(state: AnalyzerState) {
        this.state = state
    }

    analyze() {
        while (!this.state.isAtEnd()) {
            this.state.push(this.analyzeStatement(this.state.peek()))
            this.state.increment()
        }

        return this.state.getAnalyzedAst()
    }

    private analyzeStatement(node: Node): any {
        switch (node.type) {
            case 'PrintStatement': {
                return this.analyzeExpression(node.arguments)
            }
            default: {
                return this.analyzeExpression(node)
            }
        }
    }

    private analyzeExpression(node: Node) {
        switch (node.type) {
            case 'ArithmeticExpression': {
                let left = this.analyzeExpression(node.left)
                let right = this.analyzeExpression(node.right)

                switch (node.operator) {
                    case '+': {
                        if (left.type === 'NumberLiteral') {
                            if (right.type !== 'NumberLiteral') {
                                error(`Incompatible types for addition: ${left.type} and ${right.type}`)
                            }
                        } else if (left.type === 'StringLiteral') {
                            if (right.type !== 'StringLiteral') {
                                error(`Incompatible types for concatenation: ${left.type} and ${right.type}`)
                            }
                        }
                        break
                    }
                }

                return {
                    left, right
                }
            } case 'NumberLiteral': {
                return {
                    type: 'NumberLiteral',
                    value: parseFloat(node.value)
                }
            } case 'StringLiteral': {
                return {
                    type: 'StringLiteral',
                    value: String(node.value)
                }
            }
        }
    }
}