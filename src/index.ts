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

import { nativeFunctions } from './shared/native-functions.ts'

import { writeFileSync } from 'fs'

export function interprete(src: string): any {
    const lexerState = new LexerState(src)
    const lexerUtils = new LexerUtils()
    const lexer = new Lexer(lexerState, lexerUtils)
    const tokens = lexer.tokenize()
    // console.log("Tokens:", JSON.stringify(tokens, null, 2))

    const parserState = new ParserState(tokens)
    const parser = new Parser(parserState)
    const ast = parser.parse()
    // console.log("\nAST:", JSON.stringify(ast, null, 2))

    const analyzerState = new AnalyzerState(ast)
    const analyzer = new Analyzer(analyzerState)

    for (let func in nativeFunctions) {
        analyzerState.scopeStack.storeNativeFunction(func, nativeFunctions[func].length, 'any', -1)
    }

    const analyzedAst = analyzer.analyze()
    // console.log(JSON.stringify(
    //         analyzerState.scopeStack.getScopeStack(),
    //         (_: any, value: any) => (value instanceof Map ? Object.fromEntries(value) : value),
    //         2
    //     ))
    // console.log("Analyzed AST:", JSON.stringify(analyzedAst, null, 2))

    const generatorState = new GeneratorState(ast)
    const generator = new Generator(generatorState)
    const bytecodes = generator.generate()
    console.log("\nByteCodes:", JSON.stringify(bytecodes, null, 2))

    writeFileSync('compiled', bytecodes)

    const executorState = new ExecutorState(bytecodes)
    const executor = new Executor(executorState, generator.getConstantPool())

    // console.log("\nOutput:")
    executor.execute()
}

/* 
function fibonacci(n) {
    if n == 0 | n == 1
        return n;
    else 
        return fibonacci(n - 1) + fibonacci(n - 2);
}

for let i = 0; i < 10; i = i + 1
    print(fibonacci(i));

*/

interprete(`
    class Counter {
        public static counter = 0;
        
        public increment() {
            this.counter = this.counter + 1;
        }

        public get() {
            return this.counter;
        }
    }

    class Test {
        public static marks = 0;

        public set(newValue) {
            this.marks = newValue;
        }
    }

    let counter1 = Counter();
    let counter2 = Counter();

    let mid = Test();
    let final = Test();

    counter1.increment();
    counter2.increment();

    print(counter1.counter);
    print(counter2.counter);
    print(Counter.counter);

    mid.set(30);
    final.set(70);

    print(mid.marks);
    print(final.marks);
    print(Test.marks);
`)
