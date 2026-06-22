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
import {
    abs,
    pow,
    sqrt,
    floor,
    ceil,
    round,
    sin,
    cos,
    tan
} from '../stdlib/math.ts'
import {
    now,
    sleep
} from '../stdlib/time.ts'
import {
    getEnv,
    getArg,
    exit
} from '../stdlib/system.ts'

export const nativeFunctions: { [key: string]: Function } = {
    print,
    input,
    createFile,
    writeFile,
    deleteFile,
    readFile,
    appendFile,
    abs,
    pow,
    sqrt,
    floor,
    ceil,
    round,
    sin,
    cos,
    tan,
    now,
    sleep,
    getEnv,
    getArg,
    exit
}
