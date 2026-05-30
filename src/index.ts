import Analyzer from './analyzer/index.ts'
import AnalyzerState from './analyzer/state.ts'

import Lexer from './lexer/index.ts'
import LexerState from './lexer/state.ts'
import LexerUtils from './lexer/utils.ts'

import Parser from './parser/index.ts'
import ParserState from './parser/state.ts'

export default function interprete(src: string): void {
    const lexerState = new LexerState(src)
    const lexerUtils = new LexerUtils()
    const lexer = new Lexer(lexerState, lexerUtils)
    const tokens = lexer.tokenize()
    console.log("Tokens:", JSON.stringify(tokens, null, 2))

    const parserState = new ParserState(tokens)
    const parser = new Parser(parserState)
    const ast = parser.parse()
    console.log("AST:", JSON.stringify(ast, null, 2))

    const analyzerState = new AnalyzerState(ast)
    const analyzer = new Analyzer(analyzerState)
    const analyzedAst = analyzer.analyze()
    console.log("Analyzed AST:", JSON.stringify(analyzedAst, null, 2))
}

interprete(`10 + 10 + 10`) 