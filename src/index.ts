import Analyzer from './analyzer/index.ts'
import AnalyzerState from './analyzer/state.ts'

import Executor from './executor/index.ts'
import ExecutorState from './executor/state.ts'

import Generator from './generator/index.ts'
import GeneratorState from './generator/state.ts'

import Lexer from './lexer/index.ts'
import LexerState from './lexer/state.ts'
import LexerUtils from './lexer/utils.ts'

import Parser from './parser/index.ts'
import ParserState from './parser/state.ts'

import { writeFileSync } from 'fs'

export function interprete(src: string): any {
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
    // console.log("Analyzed AST:", JSON.stringify(analyzedAst, null, 2))

    const generatorState = new GeneratorState(ast)
    const generator = new Generator(generatorState)
    const bytecodes = generator.generate()
    console.log("ByteCodes:", JSON.stringify(bytecodes, null, 2))

    writeFileSync('compiled', bytecodes)

    const executorState = new ExecutorState(bytecodes)
    const executor = new Executor(executorState, generator.getConstantPool(), analyzer.getSymbolTable()) 


    executor.execute()
}

interprete(`
    let a = 10;

    if a == 10 {
        print "Hello, World!";
    } else {
        let b = "10;";
        print b; 
    }
`)

