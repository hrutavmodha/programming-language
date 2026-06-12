export default class LexerUtils {

    isSpace(char: string): boolean {
        return char === ' ' || char === '\n' || char === '\t'
    }

    isAlphabet(char: string): boolean {
        return (char >= 'A' && char <= 'Z') || (char >= 'a' && char <= 'z')
    }

    isDigit(char: string): boolean {
        return char >= '0' && char <= '9'
    }

    isUnderScore(char: string): boolean {
        return char === '_'
    }

    isDot(char: string): boolean {
        return char === '.'
    }

    isQuote(char: string): boolean {
        return char === '"' || char === "'"
    }

    isSingleLineComment(char: string): boolean {
        return char === '#'
    }
}