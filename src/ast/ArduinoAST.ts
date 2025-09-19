/**
 * Arduino C++ AST (抽象語法樹) 定義
 * 專門針對Arduino程式設計的簡化AST結構
 */

export enum ASTNodeType {
  // 程式結構
  PROGRAM = 'Program',
  FUNCTION_DECLARATION = 'FunctionDeclaration',
  VARIABLE_DECLARATION = 'VariableDeclaration',
  BLOCK_STATEMENT = 'BlockStatement',

  // 語句類型
  EXPRESSION_STATEMENT = 'ExpressionStatement',
  IF_STATEMENT = 'IfStatement',
  FOR_STATEMENT = 'ForStatement',
  WHILE_STATEMENT = 'WhileStatement',
  RETURN_STATEMENT = 'ReturnStatement',

  // 表達式類型
  CALL_EXPRESSION = 'CallExpression',
  BINARY_EXPRESSION = 'BinaryExpression',
  UNARY_EXPRESSION = 'UnaryExpression',
  ASSIGNMENT_EXPRESSION = 'AssignmentExpression',
  IDENTIFIER = 'Identifier',
  LITERAL = 'Literal',
  MEMBER_EXPRESSION = 'MemberExpression',

  // Arduino特殊節點
  ARDUINO_PIN = 'ArduinoPin',
}

export interface ASTNode {
  type: ASTNodeType;
  start?: number;
  end?: number;
  source?: string;
}

export interface Program extends ASTNode {
  type: ASTNodeType.PROGRAM;
  body: (FunctionDeclaration | VariableDeclaration)[];
}

export interface FunctionDeclaration extends ASTNode {
  type: ASTNodeType.FUNCTION_DECLARATION;
  name: Identifier;
  returnType: string;
  params: VariableDeclaration[];
  body: BlockStatement;
}

export interface VariableDeclaration extends ASTNode {
  type: ASTNodeType.VARIABLE_DECLARATION;
  dataType: string;
  name: Identifier;
  initializer?: Expression;
}

export interface BlockStatement extends ASTNode {
  type: ASTNodeType.BLOCK_STATEMENT;
  body: Statement[];
}

export interface IfStatement extends ASTNode {
  type: ASTNodeType.IF_STATEMENT;
  test: Expression;
  consequent: Statement;
  alternate?: Statement;
}

export interface ForStatement extends ASTNode {
  type: ASTNodeType.FOR_STATEMENT;
  init?: VariableDeclaration | AssignmentExpression;
  test?: Expression;
  update?: Expression;
  body: Statement;
}

export interface WhileStatement extends ASTNode {
  type: ASTNodeType.WHILE_STATEMENT;
  test: Expression;
  body: Statement;
}

export interface ExpressionStatement extends ASTNode {
  type: ASTNodeType.EXPRESSION_STATEMENT;
  expression: Expression;
}

export interface CallExpression extends ASTNode {
  type: ASTNodeType.CALL_EXPRESSION;
  callee: Expression;
  arguments: Expression[];
}

export interface BinaryExpression extends ASTNode {
  type: ASTNodeType.BINARY_EXPRESSION;
  operator: string;
  left: Expression;
  right: Expression;
}

export interface UnaryExpression extends ASTNode {
  type: ASTNodeType.UNARY_EXPRESSION;
  operator: string;
  argument: Expression;
}

export interface AssignmentExpression extends ASTNode {
  type: ASTNodeType.ASSIGNMENT_EXPRESSION;
  operator: string;
  left: Expression;
  right: Expression;
}

export interface Identifier extends ASTNode {
  type: ASTNodeType.IDENTIFIER;
  name: string;
}

export interface Literal extends ASTNode {
  type: ASTNodeType.LITERAL;
  value: string | number | boolean;
  raw: string;
}

export interface MemberExpression extends ASTNode {
  type: ASTNodeType.MEMBER_EXPRESSION;
  object: Expression;
  property: Identifier;
  computed: boolean;
}

export interface ArduinoPin extends ASTNode {
  type: ASTNodeType.ARDUINO_PIN;
  pin: string;
  isAnalog: boolean;
}

// 聯合類型
export type Statement =
  | BlockStatement
  | ExpressionStatement
  | IfStatement
  | ForStatement
  | WhileStatement
  | VariableDeclaration;

export type Expression =
  | CallExpression
  | BinaryExpression
  | UnaryExpression
  | AssignmentExpression
  | Identifier
  | Literal
  | MemberExpression
  | ArduinoPin;

// AST 工具函數
export class ASTUtils {
  /**
   * 判斷是否為Arduino函數
   */
  static isArduinoFunction(name: string): boolean {
    const arduinoFunctions = [
      'digitalWrite', 'digitalRead', 'pinMode',
      'analogWrite', 'analogRead',
      'delay', 'delayMicroseconds',
      'setup', 'loop'
    ];
    return arduinoFunctions.includes(name);
  }

  /**
   * 判斷是否為Arduino常數
   */
  static isArduinoConstant(name: string): boolean {
    const arduinoConstants = [
      'HIGH', 'LOW', 'INPUT', 'OUTPUT', 'INPUT_PULLUP',
      'true', 'false'
    ];
    return arduinoConstants.includes(name);
  }

  /**
   * 判斷是否為類比腳位
   */
  static isAnalogPin(pin: string): boolean {
    return /^A\d+$/.test(pin);
  }

  /**
   * 遍歷AST節點
   */
  static traverse(node: ASTNode, visitor: (node: ASTNode) => void): void {
    visitor(node);

    switch (node.type) {
      case ASTNodeType.PROGRAM:
        (node as Program).body.forEach(child => this.traverse(child, visitor));
        break;
      case ASTNodeType.FUNCTION_DECLARATION:
        const func = node as FunctionDeclaration;
        this.traverse(func.name, visitor);
        func.params.forEach(param => this.traverse(param, visitor));
        this.traverse(func.body, visitor);
        break;
      case ASTNodeType.BLOCK_STATEMENT:
        (node as BlockStatement).body.forEach(child => this.traverse(child, visitor));
        break;
      case ASTNodeType.IF_STATEMENT:
        const ifStmt = node as IfStatement;
        this.traverse(ifStmt.test, visitor);
        this.traverse(ifStmt.consequent, visitor);
        if (ifStmt.alternate) this.traverse(ifStmt.alternate, visitor);
        break;
      case ASTNodeType.FOR_STATEMENT:
        const forStmt = node as ForStatement;
        if (forStmt.init) this.traverse(forStmt.init, visitor);
        if (forStmt.test) this.traverse(forStmt.test, visitor);
        if (forStmt.update) this.traverse(forStmt.update, visitor);
        this.traverse(forStmt.body, visitor);
        break;
      case ASTNodeType.WHILE_STATEMENT:
        const whileStmt = node as WhileStatement;
        this.traverse(whileStmt.test, visitor);
        this.traverse(whileStmt.body, visitor);
        break;
      case ASTNodeType.EXPRESSION_STATEMENT:
        this.traverse((node as ExpressionStatement).expression, visitor);
        break;
      case ASTNodeType.CALL_EXPRESSION:
        const callExpr = node as CallExpression;
        this.traverse(callExpr.callee, visitor);
        callExpr.arguments.forEach(arg => this.traverse(arg, visitor));
        break;
      case ASTNodeType.BINARY_EXPRESSION:
        const binExpr = node as BinaryExpression;
        this.traverse(binExpr.left, visitor);
        this.traverse(binExpr.right, visitor);
        break;
      case ASTNodeType.UNARY_EXPRESSION:
        this.traverse((node as UnaryExpression).argument, visitor);
        break;
      case ASTNodeType.ASSIGNMENT_EXPRESSION:
        const assignExpr = node as AssignmentExpression;
        this.traverse(assignExpr.left, visitor);
        this.traverse(assignExpr.right, visitor);
        break;
      case ASTNodeType.MEMBER_EXPRESSION:
        const memberExpr = node as MemberExpression;
        this.traverse(memberExpr.object, visitor);
        this.traverse(memberExpr.property, visitor);
        break;
      case ASTNodeType.VARIABLE_DECLARATION:
        const varDecl = node as VariableDeclaration;
        this.traverse(varDecl.name, visitor);
        if (varDecl.initializer) this.traverse(varDecl.initializer, visitor);
        break;
      // Leaf nodes - no children to traverse
      case ASTNodeType.IDENTIFIER:
      case ASTNodeType.LITERAL:
      case ASTNodeType.ARDUINO_PIN:
        break;
    }
  }

  /**
   * 查找特定類型的節點
   */
  static findNodes<T extends ASTNode>(root: ASTNode, type: ASTNodeType): T[] {
    const results: T[] = [];
    this.traverse(root, (node) => {
      if (node.type === type) {
        results.push(node as T);
      }
    });
    return results;
  }
}