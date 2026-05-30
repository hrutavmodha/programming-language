export interface Node {
    type: string,
    [key: string]: any
}

export interface Program extends Node {
    type: 'Program',
    body: Array<Node>
}