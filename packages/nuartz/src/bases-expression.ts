/**
 * Parser for the Obsidian Bases expression language (filters and formulas):
 * literals, lists, property access, method and function calls, and the
 * `! - * / % + - < > <= >= == != && ||` operators.
 */

export type BaseExpression =
  | { type: "literal"; value: string | number | boolean | null }
  | { type: "list"; items: BaseExpression[] }
  | { type: "identifier"; name: string }
  | { type: "member"; object: BaseExpression; property: string }
  | { type: "index"; object: BaseExpression; index: BaseExpression }
  | { type: "call"; callee: BaseExpression; args: BaseExpression[] }
  | { type: "unary"; operator: "!" | "-"; argument: BaseExpression }
  | { type: "binary"; operator: string; left: BaseExpression; right: BaseExpression }

/** Thrown for syntax or features this static renderer does not implement. */
export class BaseUnsupportedError extends Error {}

type Token = { kind: "number"; value: number } | { kind: "string"; value: string } | { kind: "name"; value: string } | { kind: "punct"; value: string }

const PUNCTUATION = ["&&", "||", "==", "!=", ">=", "<=", "(", ")", "[", "]", ",", ".", "!", "+", "-", "*", "/", "%", ">", "<"]

function tokenize(source: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  while (i < source.length) {
    const char = source[i]
    if (/\s/.test(char)) { i++; continue }
    if (char === "\"" || char === "'") {
      let value = ""
      i++
      while (i < source.length && source[i] !== char) {
        if (source[i] === "\\" && i + 1 < source.length) {
          const next = source[++i]
          value += next === "n" ? "\n" : next === "t" ? "\t" : next
        } else value += source[i]
        i++
      }
      if (i >= source.length) throw new BaseUnsupportedError(`Unterminated string in "${source}"`)
      i++
      tokens.push({ kind: "string", value })
      continue
    }
    const number = /^\d+(?:\.\d+)?/.exec(source.slice(i))
    if (number) {
      tokens.push({ kind: "number", value: Number(number[0]) })
      i += number[0].length
      continue
    }
    const name = /^[\p{L}_$][\p{L}\p{N}_$]*/u.exec(source.slice(i))
    if (name) {
      tokens.push({ kind: "name", value: name[0] })
      i += name[0].length
      continue
    }
    const punct = PUNCTUATION.find(p => source.startsWith(p, i))
    if (!punct) throw new BaseUnsupportedError(`Unexpected "${char}" in "${source}"`)
    tokens.push({ kind: "punct", value: punct })
    i += punct.length
  }
  return tokens
}

const BINARY_PRECEDENCE: Record<string, number> = {
  "||": 1, "&&": 2, "==": 3, "!=": 3, "<": 4, ">": 4, "<=": 4, ">=": 4, "+": 5, "-": 5, "*": 6, "/": 6, "%": 6,
}

export function parseBaseExpression(source: string): BaseExpression {
  const tokens = tokenize(source)
  let position = 0
  const peek = () => tokens[position]
  const isPunct = (value: string) => peek()?.kind === "punct" && peek()!.value === value
  const expect = (value: string) => {
    if (!isPunct(value)) throw new BaseUnsupportedError(`Expected "${value}" in "${source}"`)
    position++
  }
  const parseArguments = (close: string) => {
    const args: BaseExpression[] = []
    if (!isPunct(close)) {
      do args.push(parseBinary(0))
      while (isPunct(",") && ++position)
    }
    expect(close)
    return args
  }

  function parsePrimary(): BaseExpression {
    const token = tokens[position++]
    if (!token) throw new BaseUnsupportedError(`Unexpected end of "${source}"`)
    if (token.kind === "number" || token.kind === "string") return { type: "literal", value: token.value }
    if (token.kind === "name") {
      if (token.value === "true" || token.value === "false") return { type: "literal", value: token.value === "true" }
      if (token.value === "null") return { type: "literal", value: null }
      return { type: "identifier", name: token.value }
    }
    if (token.value === "(") {
      const inner = parseBinary(0)
      expect(")")
      return inner
    }
    if (token.value === "[") return { type: "list", items: parseArguments("]") }
    if (token.value === "!" || token.value === "-") return { type: "unary", operator: token.value, argument: parsePostfix(parsePrimary()) }
    throw new BaseUnsupportedError(`Unexpected "${token.value}" in "${source}"`)
  }

  function parsePostfix(expression: BaseExpression): BaseExpression {
    for (;;) {
      if (isPunct(".")) {
        position++
        const name = tokens[position++]
        if (name?.kind !== "name") throw new BaseUnsupportedError(`Expected a property name in "${source}"`)
        expression = { type: "member", object: expression, property: name.value }
      } else if (isPunct("[")) {
        position++
        expression = { type: "index", object: expression, index: parseBinary(0) }
        expect("]")
      } else if (isPunct("(")) {
        position++
        expression = { type: "call", callee: expression, args: parseArguments(")") }
      } else return expression
    }
  }

  function parseBinary(minPrecedence: number): BaseExpression {
    let left = parsePostfix(parsePrimary())
    for (;;) {
      const token = peek()
      const precedence = token?.kind === "punct" ? BINARY_PRECEDENCE[token.value] : undefined
      if (precedence === undefined || precedence < minPrecedence) return left
      position++
      left = { type: "binary", operator: String(token!.value), left, right: parseBinary(precedence + 1) }
    }
  }

  const expression = parseBinary(0)
  if (position < tokens.length) throw new BaseUnsupportedError(`Unexpected "${String(tokens[position].value)}" in "${source}"`)
  return expression
}
