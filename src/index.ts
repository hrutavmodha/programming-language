import Analyzer from "./analyzer/index.ts";
import AnalyzerState from "./analyzer/state.ts";

import Executor from "./executor/index.ts";
import ExecutorState from "./executor/state.ts";

import Generator from "./generator/index.ts";
import GeneratorState from "./generator/state.ts";

import Lexer from "./lexer/index.ts";
import LexerState from "./lexer/state.ts";
import LexerUtils from "./lexer/utils.ts";
import error from "./shared/error.ts";

import Parser from "./parser/index.ts";
import ParserState from "./parser/state.ts";

import { nativeFunctions } from "./shared/native-functions.ts";

import { writeFileSync, readFileSync, existsSync } from "fs";

export default class Interpreter {
  public interpret(filePath: string, debug: boolean = false): any {
    if (!filePath.endsWith(".hssl")) {
      error(
        `Invalid file extension. HSSL interpreter only executes files with a '.hssl' extension.`,
      );
    }

    if (!existsSync(filePath)) {
      error(`File not found: "${filePath}"`);
    }

    const src = readFileSync(filePath, "utf-8");

    const lexerState = new LexerState(src);
    const lexerUtils = new LexerUtils();
    const lexer = new Lexer(lexerState, lexerUtils);
    const tokens = lexer.tokenize();

    if (debug) {
      console.log("Tokens:", JSON.stringify(tokens, null, 2));
    }

    const parserState = new ParserState(tokens);
    const parser = new Parser(parserState);
    const ast = parser.parse();

    if (debug) {
      console.log("\nAST:", JSON.stringify(ast, null, 2));
    }

    const analyzerState = new AnalyzerState(ast);
    const analyzer = new Analyzer(analyzerState);

    for (const func in nativeFunctions) {
      analyzerState.scopeStack.storeNativeFunction(
        func,
        nativeFunctions[func].length,
        "any",
        -1,
      );
    }

    const analyzedAst = analyzer.analyze();

    if (debug) {
      console.log("\nAnalyzed AST:", JSON.stringify(analyzedAst, null, 2));
    }

    const generatorState = new GeneratorState(ast);
    const generator = new Generator(generatorState);
    const bytecodes = generator.generate();

    if (debug) {
      console.log("\nByteCodes:", JSON.stringify(bytecodes, null, 2));
      writeFileSync("compiled", bytecodes);
    }

    const executorState = new ExecutorState(bytecodes);
    const executor = new Executor(executorState, generator.getConstantPool());

    const result = executor.execute();

    if (debug) {
      console.log("\n=== VM Data Structures ===");
      executor.logDataStructures();
    }

    return result;
  }
}

const args = process.argv.slice(2);
let debug = false;
export let filePath: string | undefined;

for (const arg of args) {
  if (arg === "--debug" || arg === "-d") {
    debug = true;
  } else if (!filePath) {
    filePath = arg;
  }
}

const targetPath = filePath;

const interpreter = new Interpreter();
interpreter.interpret(targetPath, debug);
