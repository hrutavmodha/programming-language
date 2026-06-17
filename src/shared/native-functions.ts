import {
    print,
    input
} from '../stdlib/io.ts'
import {
    createFile,
    writeFile,
    deleteFile,
    readFile,
    appendFile
} from '../stdlib/file.ts'

export const nativeFunctions: { [key: string]: Function } = {
    print,
    input,
    createFile,
    writeFile,
    deleteFile,
    readFile,
    appendFile
}
