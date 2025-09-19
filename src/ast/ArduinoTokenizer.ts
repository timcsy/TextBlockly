/**
 * Arduino C++ 詞法分析器 (Tokenizer)
 * 將原始碼分解為token流
 */

export enum TokenType {
  // 字面量
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  IDENTIFIER = 'IDENTIFIER',
  BOOLEAN = 'BOOLEAN',

  // 關鍵字
  VOID = 'VOID',
  INT = 'INT',
  FLOAT = 'FLOAT',
  CHAR = 'CHAR',
  BOOLEAN_TYPE = 'BOOLEAN_TYPE',
  STRING_TYPE = 'STRING_TYPE',
  IF = 'IF',
  ELSE = 'ELSE',
  FOR = 'FOR',
  WHILE = 'WHILE',
  RETURN = 'RETURN',

  // Arduino 常數
  HIGH = 'HIGH',
  LOW = 'LOW',
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
  INPUT_PULLUP = 'INPUT_PULLUP',

  // 運算符
  ASSIGN = 'ASSIGN',           // =
  PLUS_ASSIGN = 'PLUS_ASSIGN', // +=
  PLUS = 'PLUS',               // +
  MINUS = 'MINUS',             // -
  MULTIPLY = 'MULTIPLY',       // *
  DIVIDE = 'DIVIDE',           // /
  MODULO = 'MODULO',           // %
  INCREMENT = 'INCREMENT',     // ++
  DECREMENT = 'DECREMENT',     // --

  // 比較運算符
  EQUAL = 'EQUAL',             // ==
  NOT_EQUAL = 'NOT_EQUAL',     // !=
  LESS_THAN = 'LESS_THAN',     // <
  LESS_EQUAL = 'LESS_EQUAL',   // <=
  GREATER_THAN = 'GREATER_THAN', // >
  GREATER_EQUAL = 'GREATER_EQUAL', // >=

  // 邏輯運算符
  LOGICAL_AND = 'LOGICAL_AND', // &&
  LOGICAL_OR = 'LOGICAL_OR',   // ||
  LOGICAL_NOT = 'LOGICAL_NOT', // !

  // 標點符號
  SEMICOLON = 'SEMICOLON',     // ;
  COMMA = 'COMMA',             // ,
  DOT = 'DOT',                 // .
  LEFT_PAREN = 'LEFT_PAREN',   // (
  RIGHT_PAREN = 'RIGHT_PAREN', // )
  LEFT_BRACE = 'LEFT_BRACE',   // {
  RIGHT_BRACE = 'RIGHT_BRACE', // }

  // 特殊
  NEWLINE = 'NEWLINE',
  WHITESPACE = 'WHITESPACE',
  COMMENT = 'COMMENT',
  EOF = 'EOF',
}

export interface Token {
  type: TokenType;
  value: string;
  start: number;
  end: number;
  line: number;
  column: number;
}

export class ArduinoTokenizer {
  private code: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;

  // 關鍵字映射
  private keywords: Map<string, TokenType> = new Map([
    ['void', TokenType.VOID],
    ['int', TokenType.INT],
    ['float', TokenType.FLOAT],
    ['char', TokenType.CHAR],
    ['boolean', TokenType.BOOLEAN_TYPE],
    ['String', TokenType.STRING_TYPE],
    ['if', TokenType.IF],
    ['else', TokenType.ELSE],
    ['for', TokenType.FOR],
    ['while', TokenType.WHILE],
    ['return', TokenType.RETURN],
    ['true', TokenType.BOOLEAN],
    ['false', TokenType.BOOLEAN],
    ['HIGH', TokenType.HIGH],
    ['LOW', TokenType.LOW],
    ['INPUT', TokenType.INPUT],
    ['OUTPUT', TokenType.OUTPUT],
    ['INPUT_PULLUP', TokenType.INPUT_PULLUP],
  ]);

  constructor(code: string) {
    this.code = code;
  }

  /**
   * 主要的tokenize方法
   */
  public tokenize(): Token[] {
    const tokens: Token[] = [];

    while (!this.isEOF()) {
      this.skipWhitespace();

      if (this.isEOF()) break;

      const token = this.nextToken();
      if (token) {
        tokens.push(token);
      }
    }

    // 添加EOF token
    tokens.push({
      type: TokenType.EOF,
      value: '',
      start: this.position,
      end: this.position,
      line: this.line,
      column: this.column
    });

    return tokens;
  }

  /**
   * 獲取下一個token
   */
  private nextToken(): Token | null {
    const start = this.position;
    const startLine = this.line;
    const startColumn = this.column;

    const char = this.currentChar();

    // 單行註解
    if (char === '/' && this.peek() === '/') {
      return this.readComment(start, startLine, startColumn);
    }

    // 多行註解
    if (char === '/' && this.peek() === '*') {
      return this.readMultiLineComment(start, startLine, startColumn);
    }

    // 字串
    if (char === '"' || char === "'") {
      return this.readString(start, startLine, startColumn);
    }

    // 數字
    if (this.isDigit(char)) {
      return this.readNumber(start, startLine, startColumn);
    }

    // 標識符和關鍵字
    if (this.isAlpha(char) || char === '_') {
      return this.readIdentifier(start, startLine, startColumn);
    }

    // 雙字符運算符
    const doubleChar = this.currentChar() + this.peek();
    const doubleCharToken = this.getDoubleCharToken(doubleChar);
    if (doubleCharToken) {
      this.advance();
      this.advance();
      return {
        type: doubleCharToken,
        value: doubleChar,
        start,
        end: this.position,
        line: startLine,
        column: startColumn
      };
    }

    // 單字符token
    const singleCharToken = this.getSingleCharToken(char);
    if (singleCharToken) {
      this.advance();
      return {
        type: singleCharToken,
        value: char,
        start,
        end: this.position,
        line: startLine,
        column: startColumn
      };
    }

    // 未知字符 - 跳過
    this.advance();
    return null;
  }

  /**
   * 讀取註解
   */
  private readComment(start: number, startLine: number, startColumn: number): Token {
    this.advance(); // skip '/'
    this.advance(); // skip '/'

    let value = '//';
    while (!this.isEOF() && this.currentChar() !== '\n') {
      value += this.currentChar();
      this.advance();
    }

    return {
      type: TokenType.COMMENT,
      value,
      start,
      end: this.position,
      line: startLine,
      column: startColumn
    };
  }

  /**
   * 讀取多行註解
   */
  private readMultiLineComment(start: number, startLine: number, startColumn: number): Token {
    this.advance(); // skip '/'
    this.advance(); // skip '*'

    let value = '/*';
    while (!this.isEOF()) {
      if (this.currentChar() === '*' && this.peek() === '/') {
        value += '*/';
        this.advance();
        this.advance();
        break;
      }
      value += this.currentChar();
      this.advance();
    }

    return {
      type: TokenType.COMMENT,
      value,
      start,
      end: this.position,
      line: startLine,
      column: startColumn
    };
  }

  /**
   * 讀取字串
   */
  private readString(start: number, startLine: number, startColumn: number): Token {
    const quote = this.currentChar();
    let value = quote;
    this.advance();

    while (!this.isEOF() && this.currentChar() !== quote) {
      if (this.currentChar() === '\\') {
        value += this.currentChar();
        this.advance();
        if (!this.isEOF()) {
          value += this.currentChar();
          this.advance();
        }
      } else {
        value += this.currentChar();
        this.advance();
      }
    }

    if (!this.isEOF()) {
      value += this.currentChar(); // closing quote
      this.advance();
    }

    return {
      type: TokenType.STRING,
      value,
      start,
      end: this.position,
      line: startLine,
      column: startColumn
    };
  }

  /**
   * 讀取數字
   */
  private readNumber(start: number, startLine: number, startColumn: number): Token {
    let value = '';
    let hasDecimal = false;

    while (!this.isEOF() && (this.isDigit(this.currentChar()) || this.currentChar() === '.')) {
      if (this.currentChar() === '.') {
        if (hasDecimal) break; // 第二個小數點，停止
        hasDecimal = true;
      }
      value += this.currentChar();
      this.advance();
    }

    return {
      type: TokenType.NUMBER,
      value,
      start,
      end: this.position,
      line: startLine,
      column: startColumn
    };
  }

  /**
   * 讀取標識符
   */
  private readIdentifier(start: number, startLine: number, startColumn: number): Token {
    let value = '';

    while (!this.isEOF() && (this.isAlphaNumeric(this.currentChar()) || this.currentChar() === '_')) {
      value += this.currentChar();
      this.advance();
    }

    // 檢查是否為關鍵字
    const tokenType = this.keywords.get(value) || TokenType.IDENTIFIER;

    return {
      type: tokenType,
      value,
      start,
      end: this.position,
      line: startLine,
      column: startColumn
    };
  }

  /**
   * 獲取雙字符token類型
   */
  private getDoubleCharToken(chars: string): TokenType | null {
    switch (chars) {
      case '==': return TokenType.EQUAL;
      case '!=': return TokenType.NOT_EQUAL;
      case '<=': return TokenType.LESS_EQUAL;
      case '>=': return TokenType.GREATER_EQUAL;
      case '&&': return TokenType.LOGICAL_AND;
      case '||': return TokenType.LOGICAL_OR;
      case '++': return TokenType.INCREMENT;
      case '--': return TokenType.DECREMENT;
      case '+=': return TokenType.PLUS_ASSIGN;
      default: return null;
    }
  }

  /**
   * 獲取單字符token類型
   */
  private getSingleCharToken(char: string): TokenType | null {
    switch (char) {
      case '=': return TokenType.ASSIGN;
      case '+': return TokenType.PLUS;
      case '-': return TokenType.MINUS;
      case '*': return TokenType.MULTIPLY;
      case '/': return TokenType.DIVIDE;
      case '%': return TokenType.MODULO;
      case '<': return TokenType.LESS_THAN;
      case '>': return TokenType.GREATER_THAN;
      case '!': return TokenType.LOGICAL_NOT;
      case ';': return TokenType.SEMICOLON;
      case ',': return TokenType.COMMA;
      case '.': return TokenType.DOT;
      case '(': return TokenType.LEFT_PAREN;
      case ')': return TokenType.RIGHT_PAREN;
      case '{': return TokenType.LEFT_BRACE;
      case '}': return TokenType.RIGHT_BRACE;
      default: return null;
    }
  }

  /**
   * 工具方法
   */
  private currentChar(): string {
    return this.isEOF() ? '' : this.code[this.position];
  }

  private peek(offset: number = 1): string {
    const pos = this.position + offset;
    return pos >= this.code.length ? '' : this.code[pos];
  }

  private advance(): void {
    if (this.position < this.code.length) {
      if (this.code[this.position] === '\n') {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
      this.position++;
    }
  }

  private skipWhitespace(): void {
    while (!this.isEOF() && /\s/.test(this.currentChar())) {
      this.advance();
    }
  }

  private isEOF(): boolean {
    return this.position >= this.code.length;
  }

  private isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }

  private isAlpha(char: string): boolean {
    return /[a-zA-Z]/.test(char);
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }
}