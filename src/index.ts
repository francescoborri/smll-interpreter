import * as fs from 'fs'
import { AbstractSyntaxTree as AST, PARSER as parser } from './lexer-parser'
import { Interpreter } from './interpreter'

const SMLL_FOLDER = './smll'
const SMLL_SOURCE_FOLDER = `${SMLL_FOLDER}/src`
const SMLL_OUT_FOLDER = `${SMLL_FOLDER}/out`
const SOURCE_FILE_NAME = 'main.smll'

var code: string = fs.readFileSync(`${SMLL_SOURCE_FOLDER}/${SOURCE_FILE_NAME}`, 'utf8'),
    ast: AST.CommandNode = parser.parse(code)

Interpreter.run(ast)

fs.writeFileSync(`${SMLL_OUT_FOLDER}/${SOURCE_FILE_NAME}.out.json`, JSON.stringify(ast, null, 4))