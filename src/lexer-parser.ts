import { Parser } from 'jison'

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

	export type Identificator = string
	export type UnaryOperator = '!' | '+' | '-'
	export type BinaryOperator = '&&' | '||' | '+' | '-' | '*' | '/' | '//' | '%' | '>' | '<' | '>=' | '<=' | '==' | '!='
	export type Value = boolean | number
	export type Type = 'Number' | 'Boolean'

	export type Kind = CommandKind | ExpressionKind | DeclarationKind | ValueKind | TypeKind | OperatorKind

	export class Node {
		children: Node[]
		kind: Kind

		constructor(children: Node[], kind: Kind) {
			this.children = children
			this.kind = kind
		}
	}

	export class CommandNode extends Node {
		declare kind: CommandKind

		constructor(children: Node[], kind: CommandKind) {
			super(children, kind)
		}
	}

	export class DeclarationNode extends Node {
		declare kind: DeclarationKind

		constructor(children: Node[], kind: DeclarationKind) {
			super(children, kind)
		}
	}

	export class ExpressionNode extends Node {
		declare kind: ExpressionKind

		constructor(children: Node[], kind: ExpressionKind) {
			super(children, kind)
		}
	}

	export class ValueNode extends Node {
		declare kind: ValueKind
		value: Value
		type: Type

		constructor(value: Value, type: Type, kind: ValueKind) {
			super([], kind)
			this.value = value
			this.type = type
		}
	}

	export class IdentificatorNode extends ExpressionNode {
		identificator: Identificator

		constructor(identificator: Identificator) {
			super([], ExpressionKind.IDENTIFICATOR)
			this.identificator = identificator
		}
	}

	export class TypeNode extends Node {
		declare kind: TypeKind

		constructor(kind: TypeKind) {
			super([], kind)
		}
	}

	export class OperatorNode extends Node {
		declare kind: OperatorKind
		operator: BinaryOperator | UnaryOperator

		constructor(operator: BinaryOperator | UnaryOperator, kind: OperatorKind) {
			super([], kind)
			this.operator = operator
		}
	}

	export class UnaryOperatorNode extends OperatorNode {
		declare operator: UnaryOperator
		operand: ExpressionNode
		operandType: Type

		constructor(operand: ExpressionNode, operandType: Type, operator: UnaryOperator) {
			super(operator, OperatorKind.UNARY_OPERATOR)
			this.operand = operand
			this.operandType = operandType
		}
	}

	export class BinaryOperatorNode extends OperatorNode {
		declare operator: BinaryOperator
		leftOperand: ExpressionNode
		rightOperand: ExpressionNode
		leftOperandType: Type
		rightOperandType: Type

		constructor(leftOperand: ExpressionNode, rightOperand: ExpressionNode, leftOperandType: Type, rightOperandType: Type, operator: BinaryOperator) {
			super(operator, OperatorKind.BINARY_OPERATOR)
			this.leftOperand = leftOperand
			this.rightOperand = rightOperand
			this.leftOperandType = leftOperandType
			this.rightOperandType = rightOperandType
		}
	}
}

export const GRAMMAR = {
	'lex': {
		'rules': [
			['[\\t\\r\\f ]+', '/* skip whitespace */'],

			['const', "return 'CONST'"],
			['let', "return 'LET'"],
			['if', "return 'IF'"],
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
			['!="', "return '!='"],
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

			['Boolean', "return 'BOOLEAN_TYPE'"],
			['Number', "return 'NUMBER_TYPE'"],

			['true|false', "return 'BOOLEAN_VALUE'"],
			['([0-9]+[.])?[0-9]+', "return 'NUMBER_VALUE'"],

			['[a-zA-Z_][a-zA-Z0-9_]*', "return 'IDENTIFICATOR'"]
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
			['declaration command_separator command', '$$ = new yy.AST.CommandNode([$1, $3], yy.AST.CommandKind.DECLARATION_COMMAND)'],
			['command command_separator command', '$$ = new yy.AST.CommandNode([$1, $3], yy.AST.CommandKind.COMMAND_COMMAND)']
		],
		'single_command': [
			['', '$$ = new yy.AST.CommandNode([], yy.AST.CommandKind.NIL)'],
			['identificator = expression', '$$ = new yy.AST.CommandNode([$1, $3], yy.AST.CommandKind.ASSIGNMENT)'],
			['IF expression THEN command_body', '$$ = new yy.AST.CommandNode([$3, $6], yy.AST.CommandKind.IF)'],
			['IF expression THEN command_body ELSE command_body', '$$ = new yy.AST.CommandNode([$3, $6, $10], yy.AST.CommandKind.IF_ELSE)'],
			['WHILE expression DO command_body', '$$ = new yy.AST.CommandNode([$2, $6], yy.AST.CommandKind.WHILE)'],
			['PRINT expression', '$$ = new yy.AST.CommandNode([$2], yy.AST.CommandKind.PRINT)'],
			[
				'FOR declaration , expression , single_command DO command_body',
				`$$ = new yy.AST.CommandNode([$2,
					new yy.AST.CommandNode([$4,
						new yy.AST.CommandNode([$11,
							new yy.AST.CommandNode([$6, $8], yy.AST.CommandKind.ASSIGNMENT)
						], yy.AST.CommandKind.COMMAND_COMMAND)
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
			['LET : type identificator = expression', '$$ = new yy.AST.DeclarationNode([$3, $4, $6], yy.AST.DeclarationKind.VARIABLE)'],
			['CONST : type identificator = expression', '$$ = new yy.AST.DeclarationNode([$3, $4, $6], yy.AST.DeclarationKind.CONSTANT)'],
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