/**
 * Arduino C++ 語法分析器 (Parser)
 * 將token流解析為AST
 */

import {
  ASTNode, ASTNodeType, Program, FunctionDeclaration, VariableDeclaration,
  BlockStatement, Statement, Expression, IfStatement, ForStatement, WhileStatement,
  ExpressionStatement, CallExpression, BinaryExpression, UnaryExpression,
  AssignmentExpression, Identifier, Literal, MemberExpression, ArduinoPin,
  ASTUtils
} from './ArduinoAST';
import { Token, TokenType, ArduinoTokenizer } from './ArduinoTokenizer';

export class ArduinoParser {
  private tokens: Token[];
  private current: number = 0;

  constructor(code: string) {
    const tokenizer = new ArduinoTokenizer(code);
    this.tokens = tokenizer.tokenize().filter(token =>
      token.type !== TokenType.WHITESPACE &&
      token.type !== TokenType.COMMENT
    );
  }

  /**
   * 解析程式碼為AST
   */
  public parse(): Program {
    const body: (FunctionDeclaration | VariableDeclaration)[] = [];

    while (!this.isEOF()) {
      try {
        const node = this.parseTopLevel();
        if (node) {
          body.push(node);
        }
      } catch (error) {
        console.error('Parse error:', error);
        // 跳到下一個可能的起始點
        this.skipToNextStatement();
      }
    }

    return {
      type: ASTNodeType.PROGRAM,
      body
    };
  }

  /**
   * 解析頂層聲明
   */
  private parseTopLevel(): FunctionDeclaration | VariableDeclaration | null {
    // 跳過任何分號
    while (this.match(TokenType.SEMICOLON)) {}

    if (this.isEOF()) return null;

    // 檢查是否為函數聲明
    if (this.isTypeToken(this.peek()) && this.isIdentifier(this.peek(1))) {
      const nextToken = this.peek(2);
      if (nextToken && nextToken.type === TokenType.LEFT_PAREN) {
        return this.parseFunctionDeclaration();
      } else {
        return this.parseVariableDeclaration();
      }
    }

    // 跳過無法識別的token
    this.advance();
    return null;
  }

  /**
   * 解析函數聲明
   */
  private parseFunctionDeclaration(): FunctionDeclaration {
    const returnType = this.advance().value; // 返回類型
    const name = this.parseIdentifier(); // 函數名

    this.consume(TokenType.LEFT_PAREN, "Expected '(' after function name");

    const params: VariableDeclaration[] = [];
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        params.push(this.parseParameter());
      } while (this.match(TokenType.COMMA));
    }

    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after parameters");

    const body = this.parseBlockStatement();

    return {
      type: ASTNodeType.FUNCTION_DECLARATION,
      name,
      returnType,
      params,
      body
    };
  }

  /**
   * 解析參數
   */
  private parseParameter(): VariableDeclaration {
    const dataType = this.advance().value;
    const name = this.parseIdentifier();

    return {
      type: ASTNodeType.VARIABLE_DECLARATION,
      dataType,
      name
    };
  }

  /**
   * 解析變數聲明
   */
  private parseVariableDeclaration(): VariableDeclaration {
    const dataType = this.advance().value;
    const name = this.parseIdentifier();

    let initializer: Expression | undefined;
    if (this.match(TokenType.ASSIGN)) {
      initializer = this.parseExpression();
    }

    this.consume(TokenType.SEMICOLON, "Expected ';' after variable declaration");

    return {
      type: ASTNodeType.VARIABLE_DECLARATION,
      dataType,
      name,
      initializer
    };
  }

  /**
   * 解析區塊語句
   */
  private parseBlockStatement(): BlockStatement {
    const body: Statement[] = [];

    this.consume(TokenType.LEFT_BRACE, "Expected '{'");

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isEOF()) {
      const stmt = this.parseStatement();
      if (stmt) {
        body.push(stmt);
      }
    }

    this.consume(TokenType.RIGHT_BRACE, "Expected '}'");

    return {
      type: ASTNodeType.BLOCK_STATEMENT,
      body
    };
  }

  /**
   * 解析語句
   */
  private parseStatement(): Statement | null {
    try {
      // if 語句
      if (this.match(TokenType.IF)) {
        return this.parseIfStatement();
      }

      // for 語句
      if (this.match(TokenType.FOR)) {
        return this.parseForStatement();
      }

      // while 語句
      if (this.match(TokenType.WHILE)) {
        return this.parseWhileStatement();
      }

      // 區塊語句
      if (this.check(TokenType.LEFT_BRACE)) {
        return this.parseBlockStatement();
      }

      // 變數宣告
      if (this.isTypeToken(this.peek())) {
        return this.parseVariableDeclaration();
      }

      // 表達式語句
      return this.parseExpressionStatement();

    } catch (error) {
      console.error('Statement parse error:', error);
      this.skipToNextStatement();
      return null;
    }
  }

  /**
   * 解析if語句
   */
  private parseIfStatement(): IfStatement {
    this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'if'");
    const test = this.parseExpression();
    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after if condition");

    const consequent = this.parseStatement()!;
    let alternate: Statement | undefined;

    if (this.match(TokenType.ELSE)) {
      alternate = this.parseStatement()!;
    }

    return {
      type: ASTNodeType.IF_STATEMENT,
      test,
      consequent,
      alternate
    };
  }

  /**
   * 解析for語句
   */
  private parseForStatement(): ForStatement {
    this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'for'");

    let init: VariableDeclaration | AssignmentExpression | undefined;
    if (!this.check(TokenType.SEMICOLON)) {
      if (this.isTypeToken(this.peek())) {
        init = this.parseVariableDeclaration();
        // 變數宣告已經消耗了分號
      } else {
        const expr = this.parseAssignmentExpression();
        if (expr.type === ASTNodeType.ASSIGNMENT_EXPRESSION) {
          init = expr as AssignmentExpression;
        }
        this.consume(TokenType.SEMICOLON, "Expected ';' after for-loop initializer");
      }
    } else {
      this.consume(TokenType.SEMICOLON, "Expected ';'");
    }

    let test: Expression | undefined;
    if (!this.check(TokenType.SEMICOLON)) {
      test = this.parseExpression();
    }
    this.consume(TokenType.SEMICOLON, "Expected ';' after for-loop condition");

    let update: Expression | undefined;
    if (!this.check(TokenType.RIGHT_PAREN)) {
      update = this.parseExpression();
    }
    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after for-loop");

    const body = this.parseStatement()!;

    return {
      type: ASTNodeType.FOR_STATEMENT,
      init,
      test,
      update,
      body
    };
  }

  /**
   * 解析while語句
   */
  private parseWhileStatement(): WhileStatement {
    this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'while'");
    const test = this.parseExpression();
    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after while condition");

    const body = this.parseStatement()!;

    return {
      type: ASTNodeType.WHILE_STATEMENT,
      test,
      body
    };
  }

  /**
   * 解析表達式語句
   */
  private parseExpressionStatement(): ExpressionStatement {
    const expression = this.parseExpression();
    this.consume(TokenType.SEMICOLON, "Expected ';' after expression");

    return {
      type: ASTNodeType.EXPRESSION_STATEMENT,
      expression
    };
  }

  /**
   * 解析表達式（入口點）
   */
  private parseExpression(): Expression {
    return this.parseAssignmentExpression();
  }

  /**
   * 解析賦值表達式
   */
  private parseAssignmentExpression(): AssignmentExpression | Expression {
    const expr = this.parseLogicalOrExpression();

    if (this.match(TokenType.ASSIGN, TokenType.PLUS_ASSIGN)) {
      const operator = this.previous().value;
      const right = this.parseAssignmentExpression() as Expression;

      return {
        type: ASTNodeType.ASSIGNMENT_EXPRESSION,
        operator,
        left: expr,
        right
      };
    }

    return expr;
  }

  /**
   * 解析邏輯或表達式
   */
  private parseLogicalOrExpression(): Expression {
    let expr = this.parseLogicalAndExpression();

    while (this.match(TokenType.LOGICAL_OR)) {
      const operator = this.previous().value;
      const right = this.parseLogicalAndExpression();
      expr = {
        type: ASTNodeType.BINARY_EXPRESSION,
        operator,
        left: expr,
        right
      };
    }

    return expr;
  }

  /**
   * 解析邏輯與表達式
   */
  private parseLogicalAndExpression(): Expression {
    let expr = this.parseEqualityExpression();

    while (this.match(TokenType.LOGICAL_AND)) {
      const operator = this.previous().value;
      const right = this.parseEqualityExpression();
      expr = {
        type: ASTNodeType.BINARY_EXPRESSION,
        operator,
        left: expr,
        right
      };
    }

    return expr;
  }

  /**
   * 解析相等表達式
   */
  private parseEqualityExpression(): Expression {
    let expr = this.parseComparisonExpression();

    while (this.match(TokenType.EQUAL, TokenType.NOT_EQUAL)) {
      const operator = this.previous().value;
      const right = this.parseComparisonExpression();
      expr = {
        type: ASTNodeType.BINARY_EXPRESSION,
        operator,
        left: expr,
        right
      };
    }

    return expr;
  }

  /**
   * 解析比較表達式
   */
  private parseComparisonExpression(): Expression {
    let expr = this.parseArithmeticExpression();

    while (this.match(TokenType.GREATER_THAN, TokenType.GREATER_EQUAL,
                     TokenType.LESS_THAN, TokenType.LESS_EQUAL)) {
      const operator = this.previous().value;
      const right = this.parseArithmeticExpression();
      expr = {
        type: ASTNodeType.BINARY_EXPRESSION,
        operator,
        left: expr,
        right
      };
    }

    return expr;
  }

  /**
   * 解析算術表達式
   */
  private parseArithmeticExpression(): Expression {
    let expr = this.parseTermExpression();

    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const operator = this.previous().value;
      const right = this.parseTermExpression();
      expr = {
        type: ASTNodeType.BINARY_EXPRESSION,
        operator,
        left: expr,
        right
      };
    }

    return expr;
  }

  /**
   * 解析項表達式
   */
  private parseTermExpression(): Expression {
    let expr = this.parseUnaryExpression();

    while (this.match(TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.MODULO)) {
      const operator = this.previous().value;
      const right = this.parseUnaryExpression();
      expr = {
        type: ASTNodeType.BINARY_EXPRESSION,
        operator,
        left: expr,
        right
      };
    }

    return expr;
  }

  /**
   * 解析一元表達式
   */
  private parseUnaryExpression(): Expression {
    if (this.match(TokenType.LOGICAL_NOT, TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous().value;
      const argument = this.parseUnaryExpression();
      return {
        type: ASTNodeType.UNARY_EXPRESSION,
        operator,
        argument
      };
    }

    return this.parsePostfixExpression();
  }

  /**
   * 解析後綴表達式
   */
  private parsePostfixExpression(): Expression {
    let expr = this.parsePrimaryExpression();

    while (true) {
      if (this.match(TokenType.LEFT_PAREN)) {
        // 函數調用
        const args: Expression[] = [];
        if (!this.check(TokenType.RIGHT_PAREN)) {
          do {
            args.push(this.parseExpression());
          } while (this.match(TokenType.COMMA));
        }
        this.consume(TokenType.RIGHT_PAREN, "Expected ')' after arguments");

        expr = {
          type: ASTNodeType.CALL_EXPRESSION,
          callee: expr,
          arguments: args
        };
      } else if (this.match(TokenType.DOT)) {
        // 成員訪問
        const property = this.parseIdentifier();
        expr = {
          type: ASTNodeType.MEMBER_EXPRESSION,
          object: expr,
          property,
          computed: false
        };
      } else if (this.match(TokenType.INCREMENT, TokenType.DECREMENT)) {
        // 後綴增減 (目前簡化處理)
        const operator = this.previous().value;
        expr = {
          type: ASTNodeType.UNARY_EXPRESSION,
          operator: operator + '_post',
          argument: expr
        };
      } else {
        break;
      }
    }

    return expr;
  }

  /**
   * 解析主要表達式
   */
  private parsePrimaryExpression(): Expression {
    // 數字
    if (this.check(TokenType.NUMBER)) {
      const token = this.advance();
      return {
        type: ASTNodeType.LITERAL,
        value: parseFloat(token.value),
        raw: token.value
      };
    }

    // 字串
    if (this.check(TokenType.STRING)) {
      const token = this.advance();
      return {
        type: ASTNodeType.LITERAL,
        value: token.value.slice(1, -1), // 移除引號
        raw: token.value
      };
    }

    // 布林值和Arduino常數
    if (this.match(TokenType.BOOLEAN, TokenType.HIGH, TokenType.LOW,
                  TokenType.INPUT, TokenType.OUTPUT, TokenType.INPUT_PULLUP)) {
      const token = this.previous();
      return {
        type: ASTNodeType.LITERAL,
        value: token.value,
        raw: token.value
      };
    }

    // 標識符（包括Arduino腳位）
    if (this.check(TokenType.IDENTIFIER)) {
      const token = this.advance();

      // 檢查是否為Arduino類比腳位
      if (ASTUtils.isAnalogPin(token.value)) {
        return {
          type: ASTNodeType.ARDUINO_PIN,
          pin: token.value,
          isAnalog: true
        };
      }

      return {
        type: ASTNodeType.IDENTIFIER,
        name: token.value
      };
    }

    // 括號表達式
    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.parseExpression();
      this.consume(TokenType.RIGHT_PAREN, "Expected ')' after expression");
      return expr;
    }

    throw new Error(`Unexpected token: ${this.peek()?.value || 'EOF'}`);
  }

  /**
   * 解析標識符
   */
  private parseIdentifier(): Identifier {
    const token = this.consume(TokenType.IDENTIFIER, "Expected identifier");
    return {
      type: ASTNodeType.IDENTIFIER,
      name: token.value
    };
  }

  // 工具方法
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isEOF()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isEOF()) this.current++;
    return this.previous();
  }

  private isEOF(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(offset: number = 0): Token {
    const index = this.current + offset;
    if (index >= this.tokens.length) {
      return this.tokens[this.tokens.length - 1]; // EOF token
    }
    return this.tokens[index];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();

    const current = this.peek();
    throw new Error(`${message}. Got ${current.type}: "${current.value}" at line ${current.line}`);
  }

  private isTypeToken(token: Token | null): boolean {
    if (!token) return false;
    return [TokenType.VOID, TokenType.INT, TokenType.FLOAT, TokenType.CHAR,
            TokenType.BOOLEAN_TYPE, TokenType.STRING_TYPE].includes(token.type);
  }

  private isIdentifier(token: Token | null): boolean {
    return token?.type === TokenType.IDENTIFIER;
  }

  private skipToNextStatement(): void {
    while (!this.isEOF() && !this.check(TokenType.SEMICOLON) && !this.check(TokenType.RIGHT_BRACE)) {
      this.advance();
    }
    if (this.check(TokenType.SEMICOLON)) {
      this.advance();
    }
  }
}