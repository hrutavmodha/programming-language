import error from '../shared/error.ts'
import LexerState from './state.ts'
import LexerUtils from './utils.ts'

export default class Lexer {
    private state: LexerState;
    private utils: LexerUtils;

    constructor(state: LexerState, utils: LexerUtils) {
        this.state = state
        this.utils = utils
    }

    private tokenizeWord() {
        let lexeme: string = ''

        while (!this.state.isAtEnd() && this.utils.isAlphabet(this.state.peek()) || this.utils.isDigit(this.state.peek()) || this.utils.isUnderScore(this.state.peek())) {
            lexeme += this.state.peek()
            this.state.increment()
        }

        switch (lexeme) {
            case 'let': {
                this.state.push('KEYWORD_LET', lexeme, null)
                break
            } case 'const': {
                this.state.push('KEYWORD_CONST', lexeme, null)
                break
            } case 'true':
            case 'false': {
                this.state.push('BOOLEAN_LITERAL', lexeme, null)
                break
            } case 'print': { 
                this.state.push('KEYWORD_PRINT', lexeme, null)
                break
            } default: {
                this.state.push('IDENTIFIER', lexeme, null)
            }
        }
    }

    private tokenizeNumber() {
        let lexeme: string = ''

        while (!this.state.isAtEnd() && this.utils.isDigit(this.state.peek())) { 
            lexeme += this.state.peek()
            this.state.increment()
        }

        if (this.utils.isDot(this.state.peek()) && this.utils.isDigit(this.state.peek(1))) {
            lexeme += this.state.peek()
            this.state.increment()

            while (!this.state.isAtEnd() && this.utils.isDigit(this.state.peek())) { 
                lexeme += this.state.peek()
                this.state.increment()
            }
        }

        this.state.push('NUMBER_LITERAL', lexeme, lexeme)
    }

    private tokenizeString() {
        const delimiter: string = this.state.peek()
        let lexeme: string = ''

        // Consume `"`
        this.state.increment()

        while (!this.state.isAtEnd() && this.state.peek() !== delimiter) {
            lexeme += this.state.peek()
            this.state.increment()
        }
        if (this.state.advance() !== delimiter) {
            error(`Unexpected end of string literal`)
        }

        this.state.push('STRING_LITERAL', lexeme, lexeme)
    }

    private tokenizeOperator() {
        const char = this.state.peek()

        switch (char) {

            // Arithmetic Operators
            case '+': {
                this.state.push('PLUS', '+', null)
                break
            } case '-': {
                this.state.push('MINUS', '-', null)
                break
            } case '*': {
                this.state.push('STAR', '*', null)
                break
            } case '/': {
                this.state.push('SLASH', '/', null)
                break
            } case '%': {
                this.state.push('PERCENT', '%', null)
                break
            }

            // Assignment and Equality Comparison Operators
            case '=': {
                if (this.state.peek(1) === '=') {
                    this.state.push('DOUBLE_EQUALS', '==', null)
                    this.state.increment()
                } else {
                    this.state.push('EQUALS', '=', null)
                }
                break
            }

            // Comparison Operators
            case '>': {
                if (this.state.peek(1) === '=') {
                    this.state.push('GREATER_THAN_OR_EQUALS', '>=', null)
                    this.state.increment()
                } else {
                    this.state.push('GREATER_THAN', '>', null)
                }
                break
            } case '<': {
                if (this.state.peek(1) === '=') {
                    this.state.push('LESS_THAN_OR_EQUALS', '<=', null)
                    this.state.increment()
                } else {
                    this.state.push('LESS_THAN', '<', null)
                }
                break
            }

            // Logical and Not Equals Operators
            case '&': {
                this.state.push('AND', '&', null)
                break
            } case '|': {
                this.state.push('OR', '|', null)
                break
            } case '!': {
                if (this.state.peek(1) === '=') {
                    this.state.push('NOT_EQUALS', '!=', null)
                    this.state.increment()
                } else {
                    this.state.push('NOT', '!', null)
                }
                break
            }

            // Punctuations
            case '{': {
                this.state.push('OPENING_CURLY_BRACE', '{', null)
                break
            } case '}': {
                this.state.push('CLOSING_CURLY_BRACE', '}', null)
                break
            } case '(': {
                this.state.push('OPENING_PARENTHESIS', '(', null) 
                break
            } case ')': {
                this.state.push('CLOSING_PARENTHESIS', ')', null)
                break
            } case '[': {
                this.state.push('OPENING_SQUARE_BRACE', '[', null)
                break
            } case ']': {
                this.state.push('CLOSING_SQUARE_BRACE', ']', null)
                break
            } case ';': {
                this.state.push('SEMI_COLON', ';', null)
                break
            } case ',': {
                this.state.push('COMMA', ',', null)
                break
            } case ':': {
                this.state.push('COLON', ':', null)
                break
            } case '.': {
                this.state.push('DOT', '.', null)
                break
            } default: {
                return
            }
        }
    }

    public tokenize() {
        while (!this.state.isAtEnd()) {
            // White Spaces
            if (this.utils.isSpace(this.state.peek())) {
                this.state.increment()
                continue
            }

            // Keywords and Identifiers
            else if (this.utils.isAlphabet(this.state.peek())) {
                this.tokenizeWord()
                continue
            }

            // Numbers
            else if (this.utils.isDigit(this.state.peek())) {
                this.tokenizeNumber()
                continue
            }

            // Strings
            else if (this.utils.isQuote(this.state.peek())) {
                this.tokenizeString()
                continue
            }

            // Operators and Punctuations
            else {
                this.tokenizeOperator()
            }

            
            this.state.increment()
        }
        this.state.push('EndOfFile', '', null)

        return this.state.getTokens()
    }

}
