import { Parser } from 'jison'
import { SmLLError, SmLLErrorKind } from './error'

export namespace AbstractSyntaxTree {
	export enum CommandKind {
		NIL = 0,
		DECLARATION_COMMAND,
		COMMAND_COMMAND,
		ASSIGNMENT,
		IF,
		IF_ELSE,
		WHILE,
		PRINT
	}

	export enum ExpressionKind {
		VALUE = 9,
		IDENTIFICATOR,
		UNARY_OPERATOR,
		BINARY_OPERATOR,
		PARENTHESIS
	}

	export enum DeclarationKind {
		NIL = 15,
		CONSTANT,
		VARIABLE,
		DECLARATION_DECLARATION
	}

	export enum ValueKind {
		BOOLEAN = 20,
		NUMBER,
	}

	export enum TypeKind {
		BOOLEAN = 22,
		NUMBER
	}

	export enum OperatorKind {
		UNARY_OPERATOR = 24,
		BINARY_OPERATOR
	}

	export type Kind = CommandKind | ExpressionKind | DeclarationKind | ValueKind | TypeKind | OperatorKind

	export const VALID_IDENTIFICATOR_REGEX: string = '[a-zA-Z_][a-zA-Z0-9_]*'
	export type Identificator = string

	export type Value = boolean | number
	export type Type = 'num' | 'bool'

	export type Operator = UnaryOperator | BinaryOperator
	export type UnaryOperator = '!' | '+' | '-'
	export type BinaryOperator = '&&' | '||' | '+' | '-' | '*' | '/' | '//' | '%' | '^' | '>' | '<' | '>=' | '<=' | '==' | '!='

	const VALUE_KIND_TO_TYPE: Map<ValueKind, Type> = new Map<ValueKind, Type>([
		[ValueKind.BOOLEAN, 'bool'],
		[ValueKind.NUMBER, 'num']
	])

	export class Block {
		firstLine: number
		lastLine: number
		firstColumn: number
		lastColumn: number

		constructor(firstLine: number, lastLine: number, firstColumn: number, lastColumn: number) {
			this.firstLine = firstLine
			this.lastLine = lastLine
			this.firstColumn = firstColumn
			this.lastColumn = lastColumn
		}

		union(block: Block): Block {
			return new Block(this.firstLine, block.lastLine, this.firstColumn, block.lastColumn)
		}
	}

	export abstract class Node {
		children: Node[]
		kind: Kind
		block: Block

		constructor(children: Node[], kind: Kind, block: Block) {
			this.children = children
			this.kind = kind
			this.block = block
		}
	}

	export class CommandNode extends Node {
		declare kind: CommandKind

		constructor(children: Node[], kind: CommandKind, block: Block) {
			super(children, kind, block)
		}
	}

	export class DeclarationNode extends Node {
		declare kind: DeclarationKind

		constructor(children: Node[], kind: DeclarationKind, block: Block) {
			super(children, kind, block)
		}
	}

	export class ExpressionNode extends Node {
		declare kind: ExpressionKind

		constructor(children: Node[], kind: ExpressionKind, block: Block) {
			super(children, kind, block)
		}
	}

	export class ValueNode extends Node {
		declare kind: ValueKind
		value: Value
		type: Type

		constructor(value: Value, kind: ValueKind, block: Block) {
			super([], kind, block)
			this.value = value
			this.type = VALUE_KIND_TO_TYPE.get(kind)!
		}
	}

	export class TypeNode extends Node {
		declare kind: TypeKind

		constructor(kind: TypeKind, block: Block) {
			super([], kind, block)
		}
	}

	export class IdentificatorNode extends ExpressionNode {
		identificator: Identificator

		constructor(identificator: Identificator, block: Block) {
			super([], ExpressionKind.IDENTIFICATOR, block)
			this.identificator = identificator
			this.validate()
		}

		validate(): void {
			if (this.identificator.match(new RegExp(VALID_IDENTIFICATOR_REGEX)) === null)
				throw new SmLLError(`invalid identificator ${this.identificator}`, SmLLErrorKind.LEXICAL_ERROR, this.block.firstLine, this.block.firstColumn)
		}
	}

	export abstract class OperatorNode extends Node {
		declare kind: OperatorKind
		operator: Operator

		constructor(operator: BinaryOperator | UnaryOperator, kind: OperatorKind, block: Block) {
			super([], kind, block)
			this.operator = operator
		}
	}

	export class UnaryOperatorNode extends OperatorNode {
		declare operator: UnaryOperator
		operand: ExpressionNode

		constructor(operand: ExpressionNode, operator: UnaryOperator, block: Block) {
			super(operator, OperatorKind.UNARY_OPERATOR, block)
			this.operand = operand
		}
	}

	export class BinaryOperatorNode extends OperatorNode {
		declare operator: BinaryOperator
		leftOperand: ExpressionNode
		rightOperand: ExpressionNode

		constructor(leftOperand: ExpressionNode, rightOperand: ExpressionNode, operator: BinaryOperator, block: Block) {
			super(operator, OperatorKind.BINARY_OPERATOR, block)
			this.leftOperand = leftOperand
			this.rightOperand = rightOperand
		}
	}
}

export const GRAMMAR = {
	'lex': {
		'rules': [
			['[\\t\\r\\f ]+', '/* skip blank characters except \\n */'],

			['let', "return 'LET'"],
			['const', "return 'CONST'"],
			['if', "return 'IF'"],
			['then', "return 'THEN'"],
			['else', "return 'ELSE'"],
			['while', "return 'WHILE'"],
			['do', "return 'DO'"],
			['for', "return 'FOR'"], ,
			['print', "return 'PRINT'"],

			['\\n', "return 'NEWLINE'"],
			[';', "return ';'"],
			[':', "return ':'"],
			[',', "return ','"],
			['\\{', "return '{'"],
			['\\}', "return '}'"],
			['\\(', "return '('"],
			['\\)', "return ')'"],

			['&&"', "return 'AND'"],
			['\\|\\|', "return 'OR'"],
			['>=', "return '>='"],
			['<=', "return '<='"],
			['==', "return '=='"],
			['!=', "return '!='"],
			['!', "return 'NOT'"],
			['>', "return '>'"],
			['<', "return '<'"],
			['=', "return '='"],

			['//', "return '//'"],
			['\\*', "return '*'"],
			['/', "return '/'"],
			['\\+', "return '+'"],
			['-', "return '-'"],
			['\\%', "return '%'"],
			['\\^', "return '^'"],

			['bool', "return 'BOOLEAN_TYPE'"],
			['num', "return 'NUMBER_TYPE'"],

			['true|false', "return 'BOOLEAN_VALUE'"],
			['([0-9]+[.])?[0-9]+', "return 'NUMBER_VALUE'"],

			[AbstractSyntaxTree.VALID_IDENTIFICATOR_REGEX, "return 'IDENTIFICATOR'"]
		]
	},
	'operators': [
		['nonassoc', 'AND', 'OR', 'NOT'],
		['precedence', '==', '!='],
		['precedence', '<', '>', '>=', '<='],
		['precedence', '^'],
		['precedence', '+', '-'],
		['precedence', '*', '/', '//', '%'],
		['right', 'THEN', 'ELSE']
	],
	'bnf': {
		'start': [
			['command', 'return $1'],
		],
		'command': [
			['single_command', '$$ = $1'],
			['declaration command_separator command', '$$ = new yy.AST.CommandNode([$1, $3], yy.AST.CommandKind.DECLARATION_COMMAND, $1.block.union($3.block))'],
			['command command_separator command', '$$ = new yy.AST.CommandNode([$1, $3], yy.AST.CommandKind.COMMAND_COMMAND, $1.block.union($3.block))']
		],
		'single_command': [
			['', '$$ = new yy.AST.CommandNode([], yy.AST.CommandKind.NIL), new yy.AST.Block(@1.firstLine, @1.firstColumn, @1.lastLine, @1.lastColumn)'],
			['identificator = expression', '$$ = new yy.AST.CommandNode([$1, $3], yy.AST.CommandKind.ASSIGNMENT)'],
			['IF expression THEN command_body ELSE command_body', '$$ = new yy.AST.CommandNode([$2, $4, $6], yy.AST.CommandKind.IF_ELSE)'],
			['IF expression THEN command_body', '$$ = new yy.AST.CommandNode([$2, $4], yy.AST.CommandKind.IF)'],
			['WHILE expression DO command_body', '$$ = new yy.AST.CommandNode([$2, $4], yy.AST.CommandKind.WHILE)'],
			['PRINT expression', '$$ = new yy.AST.CommandNode([$2], yy.AST.CommandKind.PRINT)'],
			[
				'FOR ( declaration , expression , single_command ) DO command_body',
				`$$ = new yy.AST.CommandNode([$3,
					new yy.AST.CommandNode([$5,
						new yy.AST.CommandNode([$10, $7], yy.AST.CommandKind.COMMAND_COMMAND)
					], yy.AST.CommandKind.WHILE),
				], yy.AST.CommandKind.DECLARATION_COMMAND)`
			],
		],
		'command_body': [
			['single_command', '$$ = $1'],
			['{ command }', '$$ = $2'],
		],
		'declaration': [
			['', '$$ = new yy.AST.DeclarationNode([], yy.AST.DeclarationKind.NIL)'],
			['LET identificator : type = expression', '$$ = new yy.AST.DeclarationNode([$2, $4, $6], yy.AST.DeclarationKind.VARIABLE)'],
			['CONST identificator : type = expression', '$$ = new yy.AST.DeclarationNode([$2, $4, $6], yy.AST.DeclarationKind.CONSTANT)'],
			['declaration command_separator declaration', '$$ = new yy.AST.DeclarationNode([$1, $3], yy.AST.DeclarationKind.DECLARATION_DECLARATION)']
		],
		'expression': [
			['value', '$$ = new yy.AST.ExpressionNode([$1], yy.AST.ExpressionKind.VALUE)'],
			['identificator', '$$ = new yy.AST.ExpressionNode([$1], yy.AST.ExpressionKind.IDENTIFICATOR)'],
			['unary_operator expression', '$$ = new yy.AST.ExpressionNode([$1, $2], yy.AST.ExpressionKind.UNARY_OPERATOR)'],
			['expression binary_operator expression', '$$ = new yy.AST.ExpressionNode([$1, $2, $3], yy.AST.ExpressionKind.BINARY_OPERATOR)'],
			['( expression )', '$$ = new yy.AST.ExpressionNode([$2], yy.AST.ExpressionKind.PARENTHESIS)']
		],
		'value': [
			['NUMBER_VALUE', '$$ = new yy.AST.ValueNode($1, yy.AST.ValueKind.NUMBER)'],
			['BOOLEAN_VALUE', '$$ = new yy.AST.ValueNode($1, yy.AST.ValueKind.BOOLEAN)']
		],
		'identificator': [
			['IDENTIFICATOR', '$$ = new yy.AST.IdentificatorNode($1)'],
		],
		'type': [
			['NUMBER_TYPE', '$$ = new yy.AST.TypeNode(yy.AST.TypeKind.NUMBER)'],
			['BOOLEAN_TYPE', '$$ = new yy.AST.TypeNode(yy.AST.TypeKind.BOOLEAN)']
		],
		'unary_operator': [
			'NOT',
			'+',
			'-'
		],
		'binary_operator': [
			'AND',
			'OR',
			'>=',
			'<=',
			'==',
			'!=',
			'>',
			'<',
			'+',
			'-',
			'*',
			'/',
			'//',
			'%',
			'^'
		],
		'command_separator': [
			'NEWLINE',
			';'
		]
	}
}

export const PARSER = new Parser(GRAMMAR)
PARSER.yy.AST = AbstractSyntaxTree