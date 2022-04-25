import { AbstractSyntaxTree as AST } from './lexer-parser'

export type InterpreterErrorType = StaticErrorType | DynamicErrorType

export enum StaticErrorType {
	UNDEFINED_IDENTIFICATOR = 'UNDEFINED_IDENTIFICATOR',
	CONSTANT_REASSIGNMENT = 'CONSTANT_REASSIGNMENT',
	WRONG_TYPE = 'WRONG_TYPE',
	UNKNOWN_DECLARATION = 'UNKNOWN_DECLARATION'
}

export enum DynamicErrorType {
	DIVISION_BY_ZERO = 'DIVISION_BY_ZERO',
	UNKNOWN_OPERATOR = 'UNKNOWN_OPERATOR',
	UNKNOWN_COMMAND = 'UNKNOWN_COMMAND',
	UNKNOWN_EXPRESSION = 'UNKNOWN_EXPRESSION'
}

export class InterpreterError extends Error {
	errorType: InterpreterErrorType

	constructor(message: string, errorType: InterpreterErrorType) {
		super(message)
		this.errorType = errorType
	}
}

export class StaticError extends InterpreterError {
	declare errorType: StaticErrorType

	constructor(message: string, errorType: StaticErrorType) {
		super(message, errorType)
	}
}

export class DynamicError extends InterpreterError {
	declare errorType: DynamicErrorType

	constructor(message: string, errorType: DynamicErrorType) {
		super(message, errorType)
	}
}

export namespace Interpreter {
	export type Location = Symbol

	export type Rho = (_: AST.Identificator) => Location | AST.Value
	export type Sigma = (_: Location) => AST.Value

	export const RHO_0: Rho = (_: AST.Identificator) => { throw 'undefined' }
	export const SIGMA_0: Sigma = (_: Location) => { throw 'undefined' }

	function newLocation(): Location { return Symbol() }
	function isLocation(value: Location | AST.Value): value is Location { return typeof value === 'symbol' }

	export function run(program: AST.Node): void {
		try {
			execute(program as AST.CommandNode, RHO_0, SIGMA_0)
		} catch (error) {
			if (error instanceof InterpreterError)
				console.error(`ERROR -> ${error.errorType}: ${error.message}`)
			else
				throw error
		}
	}

	// extend Rho or Sigma with a new (key, value) pair, by creating a new function which modifies the old one by adding the new pair
	function extend<K, V>(map: (key: K) => V, newKey: K, newValue: V): (key: K) => V {
		return function (key: K) {
			if (key === newKey)
				return newValue
			else
				return map(key)
		}
	}

	export function execute(command: AST.CommandNode, rho: Rho, sigma: Sigma): Sigma {
		switch (command.kind) {
			case AST.CommandKind.NIL:
				return sigma
			case AST.CommandKind.DECLARATION_COMMAND:
				var [declaration, command1] = command.children,
					{ rho: rho1, sigma: sigma1 } = elaborate(declaration as AST.DeclarationNode, rho, sigma)

				return execute(command1 as AST.CommandNode, rho1, sigma1)
			case AST.CommandKind.COMMAND_COMMAND:
				var [command1, command2] = command.children,
					sigma1 = execute(command1 as AST.CommandNode, rho, sigma)

				return execute(command2 as AST.CommandNode, rho, sigma1)
			case AST.CommandKind.ASSIGNMENT:
				var [identificator, expression] = command.children,
					rhoResult: Location | AST.Value

				try {
					rhoResult = rho(identificator as AST.Identificator)
				} catch (error) {
					throw new StaticError(`undefined identificator '${identificator}'`, StaticErrorType.UNDEFINED_IDENTIFICATOR)
				}

				if (isLocation(rhoResult)) {
					return extend(sigma, rhoResult, evaluate(expression as AST.ExpressionNode, rho, sigma))
				} else
					throw new StaticError(`constant '${identificator}' re-assignment`, StaticErrorType.CONSTANT_REASSIGNMENT)
			case AST.CommandKind.IF:
				var [condition, command1] = command.children,
					value = evaluate(condition as AST.ExpressionNode, rho, sigma)

				if (typeof value === 'boolean')
					return value ? execute(command1 as AST.CommandNode, rho, sigma) : sigma
				else
					throw new StaticError(`expected 'boolean' type, but found '${typeof value}' type`, StaticErrorType.WRONG_TYPE)
			case AST.CommandKind.IF_ELSE:
				var [condition, command1, command2] = command.children,
					value = evaluate(condition as AST.ExpressionNode, rho, sigma)

				if (typeof value === 'boolean')
					return value ? execute(command1 as AST.CommandNode, rho, sigma) : execute(command2 as AST.CommandNode, rho, sigma)
				else
					throw new StaticError(`expected 'boolean' type, but found '${typeof value}' type`, StaticErrorType.WRONG_TYPE)
			case AST.CommandKind.WHILE:
				var [condition, command1] = command.children,
					value = evaluate(condition as AST.ExpressionNode, rho, sigma)

				if (typeof value === 'boolean')
					if (value)
						return execute(command, rho, execute(command1 as AST.CommandNode, rho, sigma))
					else
						return sigma
				else
					throw new StaticError(`expected 'boolean' type, but found '${typeof value}' type`, StaticErrorType.WRONG_TYPE)
			case AST.CommandKind.PRINT:
				var [expression] = command.children
				console.log(evaluate(expression as AST.ExpressionNode, rho, sigma))
				return sigma
			default:
				throw new DynamicError('unknown command', DynamicErrorType.UNKNOWN_COMMAND)
		}
	}

	export function evaluate(expression: AST.ExpressionNode, rho: Rho, sigma: Sigma): AST.Value {
		switch (expression.kind) {
			case AST.ExpressionKind.VALUE:
				var valueNode: AST.ValueNode = expression.children[0] as AST.ValueNode

				switch (valueNode.kind) {
					case AST.ValueKind.NUMBER:
						return Number(valueNode.token)
					case AST.ValueKind.BOOLEAN:
						return Boolean(valueNode.token)
				}
			case AST.ExpressionKind.IDENTIFICATOR:
				var identificator: AST.Identificator = expression.children[0] as AST.Identificator,
					rhoResult: Location | AST.Value

				try {
					rhoResult = rho(identificator)
				} catch (error) {
					throw new StaticError(`undefined identificator '${identificator}'`, StaticErrorType.UNDEFINED_IDENTIFICATOR)
				}

				return isLocation(rhoResult) ? sigma(rhoResult) : rhoResult
			case AST.ExpressionKind.UNARY_OPERATOR:
				var [operator, operand] = expression.children,
					value: AST.Value = evaluate(operand as AST.ExpressionNode, rho, sigma)

				switch (operator) {
					case '!':
						if (typeof value === 'boolean')
							return !value
						else
							throw new StaticError(`expected 'boolean' type, but found '${typeof value}' type`, StaticErrorType.WRONG_TYPE)
					case '+':
						if (typeof value === 'number')
							return value
						else
							throw new StaticError(`expected 'number' type, but found '${typeof value}' type`, StaticErrorType.WRONG_TYPE)
					case '-':
						if (typeof value === 'number')
							return value
						else
							throw new StaticError(`expected 'boolean' type, but found '${typeof value}' type`, StaticErrorType.WRONG_TYPE)
				}
			case AST.ExpressionKind.BINARY_OPERATOR:
				var [operand1, operator, operand2] = expression.children,
					value1: AST.Value = evaluate(operand1 as AST.ExpressionNode, rho, sigma),
					value2: AST.Value = evaluate(operand2 as AST.ExpressionNode, rho, sigma)

				switch (operator) {
					case '+':
						if (typeof value1 === 'number')
							if (typeof value2 === 'number')
								return value1 + value2
							else
								throw new StaticError(`expected 'number' type, but found '${typeof value2}' type`, StaticErrorType.WRONG_TYPE)
						else
							throw new StaticError(`expected 'number' type, but found '${typeof value1}' type`, StaticErrorType.WRONG_TYPE)
					case '-':
						if (typeof value1 === 'number')
							if (typeof value2 === 'number')
								return value1 - value2
							else
								throw new StaticError(`expected 'number' type, but found '${typeof value2}' type`, StaticErrorType.WRONG_TYPE)
						else
							throw new StaticError(`expected 'number' type, but found '${typeof value1}' type`, StaticErrorType.WRONG_TYPE)
					case '*':
						if (typeof value1 === 'number')
							if (typeof value2 === 'number')
								return value1 * value2
							else
								throw new StaticError(`expected 'number' type, but found '${typeof value2}' type`, StaticErrorType.WRONG_TYPE)
						else
							throw new StaticError(`expected 'number' type, but found '${typeof value1}' type`, StaticErrorType.WRONG_TYPE)
					case '/':
						if (typeof value1 === 'number')
							if (typeof value2 === 'number')
								if (value2 !== 0)
									return value1 / value2
								else
									throw new DynamicError('division by zero', DynamicErrorType.DIVISION_BY_ZERO)
							else
								throw new StaticError(`expected 'number' type, but found '${typeof value2}' type`, StaticErrorType.WRONG_TYPE)
						else
							throw new StaticError(`expected 'number' type, but found '${typeof value1}' type`, StaticErrorType.WRONG_TYPE)
					case '==':
						if (typeof value1 === typeof value2)
							return value1 === value2
						else
							throw new StaticError(`expected '${typeof value1}' type, but found '${typeof value2}' type`, StaticErrorType.WRONG_TYPE)
					case '!=':
						if (typeof value1 === typeof value2)
							return value1 === value2
						else
							throw new StaticError(`expected '${typeof value1}' type, but found '${typeof value2}' type`, StaticErrorType.WRONG_TYPE)
					case '<':
						if (typeof value1 === 'number')
							if (typeof value2 === 'number')
								return value1 < value2
							else
								throw new StaticError(`expected 'number' type, but found '${typeof value2}' type`, StaticErrorType.WRONG_TYPE)
						else
							throw new StaticError(`expected 'number' type, but found '${typeof value1}' type`, StaticErrorType.WRONG_TYPE)
					case '>':
						if (typeof value1 === 'number')
							if (typeof value2 === 'number')
								return value1 > value2
							else
								throw new StaticError(`expected 'number' type, but found '${typeof value2}' type`, StaticErrorType.WRONG_TYPE)
						else
							throw new StaticError(`expected 'number' type, but found '${typeof value1}' type`, StaticErrorType.WRONG_TYPE)
					case '<=':
						if (typeof value1 === 'number')
							if (typeof value2 === 'number')
								return value1 <= value2
							else
								throw new StaticError(`expected 'number' type, but found '${typeof value2}' type`, StaticErrorType.WRONG_TYPE)
						else
							throw new StaticError(`expected 'number' type, but found '${typeof value1}' type`, StaticErrorType.WRONG_TYPE)
					case '>=':
						if (typeof value1 === 'number')
							if (typeof value2 === 'number')
								return value1 >= value2
							else
								throw new StaticError(`expected 'number' type, but found '${typeof value2}' type`, StaticErrorType.WRONG_TYPE)
						else
							throw new StaticError(`expected 'number' type, but found '${typeof value1}' type`, StaticErrorType.WRONG_TYPE)
					case '&&':
						if (typeof value1 === 'boolean')
							if (typeof value2 === 'boolean')
								return value1 && value2
							else
								throw new StaticError(`expected 'boolean' type, but found '${typeof value2}' type`, StaticErrorType.WRONG_TYPE)
						else
							throw new StaticError(`expected 'boolean' type, but found '${typeof value1}' type`, StaticErrorType.WRONG_TYPE)
					case '||':
						if (typeof value1 === 'boolean')
							if (typeof value2 === 'boolean')
								return value1 || value2
							else
								throw new StaticError(`expected 'boolean' type, but found '${typeof value2}' type`, StaticErrorType.WRONG_TYPE)
						else
							throw new StaticError(`expected 'boolean' type, but found '${typeof value1}' type`, StaticErrorType.WRONG_TYPE)
					case '//':
						if (typeof value1 === 'number')
							if (typeof value2 === 'number')
								if (value2 !== 0)
									return Math.floor(value1 / value2)
								else
									throw new DynamicError('division by zero', DynamicErrorType.DIVISION_BY_ZERO)
							else
								throw new StaticError(`expected 'number' type, but found '${typeof value2}' type`, StaticErrorType.WRONG_TYPE)
						else
							throw new StaticError(`expected 'number' type, but found '${typeof value1}' type`, StaticErrorType.WRONG_TYPE)
					case '%':
						if (typeof value1 === 'number')
							if (typeof value2 === 'number')
								if (value2 !== 0)
									return value1 % value2
								else
									throw new DynamicError('division by zero', DynamicErrorType.DIVISION_BY_ZERO)
							else
								throw new StaticError(`expected 'number' type, but found '${typeof value2}' type`, StaticErrorType.WRONG_TYPE)
						else
							throw new StaticError(`expected 'number' type, but found '${typeof value1}' type`, StaticErrorType.WRONG_TYPE)
					case '^':
						if (typeof value1 === 'number')
							if (typeof value2 === 'number')
								return Math.pow(value1, value2)
							else
								throw new StaticError(`expected 'number' type, but found '${typeof value2}' type`, StaticErrorType.WRONG_TYPE)
						else
							throw new StaticError(`expected 'number' type, but found '${typeof value1}' type`, StaticErrorType.WRONG_TYPE)
					default:
						throw new DynamicError(`unknown operator '${operator}'`, DynamicErrorType.UNKNOWN_OPERATOR)
				}
			case AST.ExpressionKind.PARENTHESIS:
				return evaluate(expression.children[0] as AST.ExpressionNode, rho, sigma)
			default:
				throw new DynamicError('unknown expression', DynamicErrorType.UNKNOWN_EXPRESSION)
		}
	}

	export function elaborate(declaration: AST.DeclarationNode, rho: Rho, sigma: Sigma): { rho: Rho, sigma: Sigma } {
		switch (declaration.kind) {
			case AST.DeclarationKind.NIL:
				return { rho, sigma }
			case AST.DeclarationKind.VARIABLE:
				var [identificator, expression] = declaration.children,
					location = newLocation(),
					value = evaluate(expression as AST.ExpressionNode, rho, sigma)

				return {
					rho: extend(rho, identificator as AST.Identificator, location),
					sigma: extend(sigma, location, value)
				}
			case AST.DeclarationKind.CONSTANT:
				var [identificator, expression] = declaration.children,
					value = evaluate(expression as AST.ExpressionNode, rho, sigma)

				return { rho: extend(rho, identificator as AST.Identificator, value), sigma }
			case AST.DeclarationKind.DECLARATION_DECLARATION:
				var [declaration1, declaration2] = declaration.children,
					{ rho: rho1, sigma: sigma1 } = elaborate(declaration1 as AST.DeclarationNode, rho, sigma)

				return elaborate(declaration2 as AST.DeclarationNode, rho1, sigma1)
			default:
				throw new StaticError('unknown declaration', StaticErrorType.UNKNOWN_DECLARATION)
		}
	}
}