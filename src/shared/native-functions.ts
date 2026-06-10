export const nativeFunctions: { [key: string]: Function } = {
    print: (arg: any) => process.stdout.write(arg + '\n'),
    add: (a: number, b: number) => a + b
}
