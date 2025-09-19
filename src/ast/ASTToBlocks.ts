/**
 * AST to Blockly 轉換器
 * 將AST節點轉換為Blockly積木結構
 */

import {
  ASTNode, ASTNodeType, Program, FunctionDeclaration, VariableDeclaration,
  BlockStatement, Statement, Expression, IfStatement, ForStatement, WhileStatement,
  ExpressionStatement, CallExpression, BinaryExpression, UnaryExpression,
  AssignmentExpression, Identifier, Literal, MemberExpression, ArduinoPin,
  ASTUtils
} from './ArduinoAST';

export interface BlocklyBlock {
  type: string;
  fields?: { [key: string]: any };
  inputs?: { [key: string]: any };
}

export interface BlocklyWorkspace {
  setupBlocks: BlocklyBlock[];
  loopBlocks: BlocklyBlock[];
  globalVariables: BlocklyBlock[];
}

export class ASTToBlocks {
  /**
   * 轉換程式為Blockly工作區
   */
  public convertProgram(ast: Program): BlocklyWorkspace {
    const workspace: BlocklyWorkspace = {
      setupBlocks: [],
      loopBlocks: [],
      globalVariables: []
    };

    for (const node of ast.body) {
      if (node.type === ASTNodeType.FUNCTION_DECLARATION) {
        const func = node as FunctionDeclaration;
        if (func.name.name === 'setup') {
          workspace.setupBlocks = this.convertBlockStatement(func.body);
        } else if (func.name.name === 'loop') {
          workspace.loopBlocks = this.convertBlockStatement(func.body);
        }
      } else if (node.type === ASTNodeType.VARIABLE_DECLARATION) {
        workspace.globalVariables.push(this.convertVariableDeclaration(node));
      }
    }

    return workspace;
  }

  /**
   * 轉換區塊語句
   */
  private convertBlockStatement(block: BlockStatement): BlocklyBlock[] {
    const blocks: BlocklyBlock[] = [];

    for (const statement of block.body) {
      const blocklyBlock = this.convertStatement(statement);
      if (blocklyBlock) {
        blocks.push(blocklyBlock);
      }
    }

    return blocks;
  }

  /**
   * 轉換語句
   */
  private convertStatement(statement: Statement): BlocklyBlock | null {
    switch (statement.type) {
      case ASTNodeType.EXPRESSION_STATEMENT:
        return this.convertExpressionStatement(statement as ExpressionStatement);

      case ASTNodeType.IF_STATEMENT:
        return this.convertIfStatement(statement as IfStatement);

      case ASTNodeType.FOR_STATEMENT:
        return this.convertForStatement(statement as ForStatement);

      case ASTNodeType.WHILE_STATEMENT:
        return this.convertWhileStatement(statement as WhileStatement);

      case ASTNodeType.BLOCK_STATEMENT:
        // 對於嵌套的區塊語句，我們需要特殊處理
        // 這裡簡化為返回null，實際應用中可能需要更複雜的邏輯
        return null;

      case ASTNodeType.VARIABLE_DECLARATION:
        return this.convertVariableDeclaration(statement as VariableDeclaration);

      default:
        console.warn(`Unhandled statement type: ${(statement as any).type}`);
        return null;
    }
  }

  /**
   * 轉換表達式語句
   */
  private convertExpressionStatement(stmt: ExpressionStatement): BlocklyBlock | null {
    const expression = stmt.expression;

    // 函數調用
    if (expression.type === ASTNodeType.CALL_EXPRESSION) {
      const callExpr = expression as CallExpression;
      return this.convertCallExpression(callExpr);
    }

    // 賦值表達式
    if (expression.type === ASTNodeType.ASSIGNMENT_EXPRESSION) {
      const assignExpr = expression as AssignmentExpression;
      return this.convertAssignmentExpression(assignExpr);
    }

    // 其他表達式作為語句，使用萬用積木
    return {
      type: 'arduino_raw_statement',
      fields: {
        CODE: this.expressionToString(expression)
      }
    };
  }

  /**
   * 轉換if語句
   */
  private convertIfStatement(stmt: IfStatement): BlocklyBlock {
    const result: BlocklyBlock = {
      type: 'controls_if',
      fields: {},
      inputs: {
        IF0: this.convertExpression(stmt.test),
        DO0: stmt.consequent.type === ASTNodeType.BLOCK_STATEMENT
          ? this.convertBlockStatement(stmt.consequent as BlockStatement)
          : [this.convertStatement(stmt.consequent)!].filter(Boolean)
      }
    };

    if (stmt.alternate) {
      result.inputs!.ELSE = stmt.alternate.type === ASTNodeType.BLOCK_STATEMENT
        ? this.convertBlockStatement(stmt.alternate as BlockStatement)
        : [this.convertStatement(stmt.alternate)!].filter(Boolean);
    }

    return result;
  }

  /**
   * 轉換for語句
   */
  private convertForStatement(stmt: ForStatement): BlocklyBlock {
    // 檢查是否為簡單的重複迴圈 for(int i = 0; i < n; i++)
    if (this.isSimpleRepeatLoop(stmt)) {
      const times = this.extractRepeatTimes(stmt);
      return {
        type: 'controls_repeat_ext',
        fields: {},
        inputs: {
          TIMES: times ? this.convertExpression(times) : { type: 'math_number', fields: { NUM: 10 } },
          DO: stmt.body.type === ASTNodeType.BLOCK_STATEMENT
            ? this.convertBlockStatement(stmt.body as BlockStatement)
            : [this.convertStatement(stmt.body)!].filter(Boolean)
        }
      };
    }

    // 複雜的for迴圈，使用萬用積木
    return {
      type: 'arduino_raw_statement',
      fields: {
        CODE: this.forStatementToString(stmt)
      }
    };
  }

  /**
   * 轉換while語句
   */
  private convertWhileStatement(stmt: WhileStatement): BlocklyBlock {
    return {
      type: 'controls_whileUntil',
      fields: { MODE: 'WHILE' },
      inputs: {
        BOOL: this.convertExpression(stmt.test),
        DO: stmt.body.type === ASTNodeType.BLOCK_STATEMENT
          ? this.convertBlockStatement(stmt.body as BlockStatement)
          : [this.convertStatement(stmt.body)!].filter(Boolean)
      }
    };
  }

  /**
   * 轉換變數宣告
   */
  private convertVariableDeclaration(decl: VariableDeclaration): BlocklyBlock {
    if (decl.initializer) {
      // 變數定義（有初始值）
      return {
        type: 'variables_define',
        fields: {
          TYPE: decl.dataType,
          VAR: decl.name.name
        },
        inputs: {
          VALUE: this.convertExpression(decl.initializer)
        }
      };
    } else {
      // 變數宣告（無初始值）
      return {
        type: 'variables_declare',
        fields: {
          TYPE: decl.dataType,
          VAR: decl.name.name
        }
      };
    }
  }

  /**
   * 轉換賦值表達式
   */
  private convertAssignmentExpression(expr: AssignmentExpression): BlocklyBlock {
    if (expr.operator === '=') {
      return {
        type: 'variables_set',
        fields: {
          VAR: this.getVariableName(expr.left)
        },
        inputs: {
          VALUE: this.convertExpression(expr.right)
        }
      };
    }

    // 其他賦值運算符，使用萬用積木
    return {
      type: 'arduino_raw_statement',
      fields: {
        CODE: `${this.expressionToString(expr.left)} ${expr.operator} ${this.expressionToString(expr.right)}`
      }
    };
  }

  /**
   * 轉換函數調用
   */
  private convertCallExpression(expr: CallExpression): BlocklyBlock | null {
    const callee = expr.callee;

    if (callee.type === ASTNodeType.IDENTIFIER) {
      const funcName = (callee as Identifier).name;

      switch (funcName) {
        case 'digitalWrite':
          if (expr.arguments.length === 2) {
            const [pin, state] = expr.arguments;

            // 檢查state是否為HIGH/LOW常數
            if (state.type === ASTNodeType.LITERAL &&
                ['HIGH', 'LOW'].includes((state as Literal).value as string)) {
              return {
                type: 'arduino_digitalwrite',
                fields: {
                  STATE: (state as Literal).value as string
                },
                inputs: {
                  PIN: this.convertExpression(pin)
                }
              };
            }
          }
          break;

        case 'pinMode':
          if (expr.arguments.length === 2) {
            const [pin, mode] = expr.arguments;

            if (mode.type === ASTNodeType.LITERAL &&
                ['INPUT', 'OUTPUT', 'INPUT_PULLUP'].includes((mode as Literal).value as string)) {
              return {
                type: 'arduino_pinmode',
                fields: {
                  MODE: (mode as Literal).value as string
                },
                inputs: {
                  PIN: this.convertExpression(pin)
                }
              };
            }
          }
          break;

        case 'analogWrite':
          if (expr.arguments.length === 2) {
            return {
              type: 'arduino_analogwrite',
              fields: {},
              inputs: {
                PIN: this.convertExpression(expr.arguments[0]),
                VALUE: this.convertExpression(expr.arguments[1])
              }
            };
          }
          break;

        case 'delay':
          if (expr.arguments.length === 1) {
            const timeArg = expr.arguments[0];
            if (timeArg.type === ASTNodeType.LITERAL) {
              return {
                type: 'arduino_delay',
                fields: {
                  TIME: (timeArg as Literal).value
                }
              };
            }
          }
          break;

        case 'delayMicroseconds':
          if (expr.arguments.length === 1) {
            const timeArg = expr.arguments[0];
            if (timeArg.type === ASTNodeType.LITERAL) {
              return {
                type: 'arduino_delayMicroseconds',
                fields: {
                  TIME: (timeArg as Literal).value
                }
              };
            }
          }
          break;

        // 數學函數
        case 'map':
          if (expr.arguments.length === 5) {
            return {
              type: 'arduino_map',
              fields: {},
              inputs: {
                VALUE: this.convertExpression(expr.arguments[0]),
                FROM_LOW: this.convertExpression(expr.arguments[1]),
                FROM_HIGH: this.convertExpression(expr.arguments[2]),
                TO_LOW: this.convertExpression(expr.arguments[3]),
                TO_HIGH: this.convertExpression(expr.arguments[4])
              }
            };
          }
          break;

        case 'constrain':
          if (expr.arguments.length === 3) {
            return {
              type: 'arduino_constrain',
              fields: {},
              inputs: {
                VALUE: this.convertExpression(expr.arguments[0]),
                MIN: this.convertExpression(expr.arguments[1]),
                MAX: this.convertExpression(expr.arguments[2])
              }
            };
          }
          break;

        case 'min':
          if (expr.arguments.length === 2) {
            return {
              type: 'arduino_min',
              fields: {},
              inputs: {
                A: this.convertExpression(expr.arguments[0]),
                B: this.convertExpression(expr.arguments[1])
              }
            };
          }
          break;

        case 'max':
          if (expr.arguments.length === 2) {
            return {
              type: 'arduino_max',
              fields: {},
              inputs: {
                A: this.convertExpression(expr.arguments[0]),
                B: this.convertExpression(expr.arguments[1])
              }
            };
          }
          break;

        case 'abs':
          if (expr.arguments.length === 1) {
            return {
              type: 'arduino_abs',
              fields: {},
              inputs: {
                VALUE: this.convertExpression(expr.arguments[0])
              }
            };
          }
          break;

        case 'pow':
          if (expr.arguments.length === 2) {
            return {
              type: 'arduino_pow',
              fields: {},
              inputs: {
                BASE: this.convertExpression(expr.arguments[0]),
                EXPONENT: this.convertExpression(expr.arguments[1])
              }
            };
          }
          break;

        case 'sqrt':
          if (expr.arguments.length === 1) {
            return {
              type: 'arduino_sqrt',
              fields: {},
              inputs: {
                VALUE: this.convertExpression(expr.arguments[0])
              }
            };
          }
          break;

        // 時間函數
        case 'millis':
          if (expr.arguments.length === 0) {
            return {
              type: 'arduino_millis',
              fields: {}
            };
          }
          break;

        case 'micros':
          if (expr.arguments.length === 0) {
            return {
              type: 'arduino_micros',
              fields: {}
            };
          }
          break;

        // 隨機數函數
        case 'random':
          if (expr.arguments.length === 2) {
            return {
              type: 'arduino_random',
              fields: {},
              inputs: {
                MIN: this.convertExpression(expr.arguments[0]),
                MAX: this.convertExpression(expr.arguments[1])
              }
            };
          }
          break;

        case 'randomSeed':
          if (expr.arguments.length === 1) {
            return {
              type: 'arduino_random_seed',
              fields: {},
              inputs: {
                SEED: this.convertExpression(expr.arguments[0])
              }
            };
          }
          break;
      }
    }

    // 處理Serial.print等成員函數調用
    if (callee.type === ASTNodeType.MEMBER_EXPRESSION) {
      const memberExpr = callee as MemberExpression;
      if (memberExpr.object.type === ASTNodeType.IDENTIFIER &&
          (memberExpr.object as Identifier).name === 'Serial') {
        const methodName = memberExpr.property.name;

        if (methodName === 'begin' && expr.arguments.length === 1) {
          return {
            type: 'arduino_serial_begin',
            fields: {},
            inputs: {
              BAUD: this.convertExpression(expr.arguments[0])
            }
          };
        }

        if ((methodName === 'print' || methodName === 'println') && expr.arguments.length === 1) {
          return {
            type: 'arduino_serial_print',
            fields: {
              MODE: methodName === 'println' ? 'PRINTLN' : 'PRINT'
            },
            inputs: {
              TEXT: this.convertExpression(expr.arguments[0])
            }
          };
        }

        // Serial.available()
        if (methodName === 'available' && expr.arguments.length === 0) {
          return {
            type: 'arduino_serial_available',
            fields: {}
          };
        }

        // Serial.read()
        if (methodName === 'read' && expr.arguments.length === 0) {
          return {
            type: 'arduino_serial_read',
            fields: {}
          };
        }

        // Serial.readString()
        if (methodName === 'readString' && expr.arguments.length === 0) {
          return {
            type: 'arduino_serial_read_string',
            fields: {}
          };
        }

        // 其他Serial方法，使用萬用積木
        return {
          type: 'arduino_raw_statement',
          fields: {
            CODE: this.callExpressionToString(expr)
          }
        };
      }
    }

    // 未知函數調用，使用萬用積木
    return {
      type: 'arduino_raw_statement',
      fields: {
        CODE: this.callExpressionToString(expr)
      }
    };
  }

  /**
   * 轉換表達式
   */
  private convertExpression(expr: Expression): BlocklyBlock {
    switch (expr.type) {
      case ASTNodeType.LITERAL:
        const literal = expr as Literal;
        if (typeof literal.value === 'number') {
          return {
            type: 'math_number',
            fields: { NUM: literal.value }
          };
        } else if (typeof literal.value === 'string') {
          if (['HIGH', 'LOW', 'true', 'false'].includes(literal.value)) {
            return {
              type: 'logic_boolean',
              fields: { BOOL: literal.value === 'HIGH' || literal.value === 'true' ? 'TRUE' : 'FALSE' }
            };
          } else {
            return {
              type: 'text',
              fields: { TEXT: literal.value }
            };
          }
        }
        break;

      case ASTNodeType.IDENTIFIER:
        return {
          type: 'variables_get',
          fields: { VAR: (expr as Identifier).name }
        };

      case ASTNodeType.ARDUINO_PIN:
        const pin = expr as ArduinoPin;
        return {
          type: 'arduino_raw_expression',
          fields: { CODE: pin.pin }
        };

      case ASTNodeType.CALL_EXPRESSION:
        const callExpr = expr as CallExpression;

        // 檢查是否為Arduino讀取函數
        if (callExpr.callee.type === ASTNodeType.IDENTIFIER) {
          const funcName = (callExpr.callee as Identifier).name;

          if (funcName === 'digitalRead' && callExpr.arguments.length === 1) {
            return {
              type: 'arduino_digitalread',
              fields: {},
              inputs: {
                PIN: this.convertExpression(callExpr.arguments[0])
              }
            };
          }

          if (funcName === 'analogRead' && callExpr.arguments.length === 1) {
            return {
              type: 'arduino_analogread',
              fields: {},
              inputs: {
                PIN: this.convertExpression(callExpr.arguments[0])
              }
            };
          }

          // 數學函數
          if (funcName === 'map' && callExpr.arguments.length === 5) {
            return {
              type: 'arduino_map',
              fields: {},
              inputs: {
                VALUE: this.convertExpression(callExpr.arguments[0]),
                FROM_LOW: this.convertExpression(callExpr.arguments[1]),
                FROM_HIGH: this.convertExpression(callExpr.arguments[2]),
                TO_LOW: this.convertExpression(callExpr.arguments[3]),
                TO_HIGH: this.convertExpression(callExpr.arguments[4])
              }
            };
          }

          if (funcName === 'constrain' && callExpr.arguments.length === 3) {
            return {
              type: 'arduino_constrain',
              fields: {},
              inputs: {
                VALUE: this.convertExpression(callExpr.arguments[0]),
                MIN: this.convertExpression(callExpr.arguments[1]),
                MAX: this.convertExpression(callExpr.arguments[2])
              }
            };
          }

          if (funcName === 'min' && callExpr.arguments.length === 2) {
            return {
              type: 'arduino_min',
              fields: {},
              inputs: {
                A: this.convertExpression(callExpr.arguments[0]),
                B: this.convertExpression(callExpr.arguments[1])
              }
            };
          }

          if (funcName === 'max' && callExpr.arguments.length === 2) {
            return {
              type: 'arduino_max',
              fields: {},
              inputs: {
                A: this.convertExpression(callExpr.arguments[0]),
                B: this.convertExpression(callExpr.arguments[1])
              }
            };
          }

          if (funcName === 'abs' && callExpr.arguments.length === 1) {
            return {
              type: 'arduino_abs',
              fields: {},
              inputs: {
                VALUE: this.convertExpression(callExpr.arguments[0])
              }
            };
          }

          if (funcName === 'pow' && callExpr.arguments.length === 2) {
            return {
              type: 'arduino_pow',
              fields: {},
              inputs: {
                BASE: this.convertExpression(callExpr.arguments[0]),
                EXPONENT: this.convertExpression(callExpr.arguments[1])
              }
            };
          }

          if (funcName === 'sqrt' && callExpr.arguments.length === 1) {
            return {
              type: 'arduino_sqrt',
              fields: {},
              inputs: {
                VALUE: this.convertExpression(callExpr.arguments[0])
              }
            };
          }

          // 時間函數
          if (funcName === 'millis' && callExpr.arguments.length === 0) {
            return {
              type: 'arduino_millis',
              fields: {}
            };
          }

          if (funcName === 'micros' && callExpr.arguments.length === 0) {
            return {
              type: 'arduino_micros',
              fields: {}
            };
          }

          // 隨機數函數
          if (funcName === 'random' && callExpr.arguments.length === 2) {
            return {
              type: 'arduino_random',
              fields: {},
              inputs: {
                MIN: this.convertExpression(callExpr.arguments[0]),
                MAX: this.convertExpression(callExpr.arguments[1])
              }
            };
          }
        }

        // 其他函數調用，使用萬用表達式
        return {
          type: 'arduino_raw_expression',
          fields: { CODE: this.callExpressionToString(callExpr) }
        };

      case ASTNodeType.BINARY_EXPRESSION:
        const binExpr = expr as BinaryExpression;

        // 數學運算
        const mathOps: { [key: string]: string } = {
          '+': 'ADD', '-': 'MINUS', '*': 'MULTIPLY', '/': 'DIVIDE', '%': 'MODULO'
        };

        if (mathOps[binExpr.operator]) {
          return {
            type: 'math_arithmetic',
            fields: { OP: mathOps[binExpr.operator] },
            inputs: {
              A: this.convertExpression(binExpr.left),
              B: this.convertExpression(binExpr.right)
            }
          };
        }

        // 比較運算
        const compareOps: { [key: string]: string } = {
          '==': 'EQ', '!=': 'NEQ', '<': 'LT', '<=': 'LTE', '>': 'GT', '>=': 'GTE'
        };

        if (compareOps[binExpr.operator]) {
          return {
            type: 'logic_compare',
            fields: { OP: compareOps[binExpr.operator] },
            inputs: {
              A: this.convertExpression(binExpr.left),
              B: this.convertExpression(binExpr.right)
            }
          };
        }

        // 邏輯運算
        if (binExpr.operator === '&&' || binExpr.operator === '||') {
          return {
            type: 'logic_operation',
            fields: { OP: binExpr.operator === '&&' ? 'AND' : 'OR' },
            inputs: {
              A: this.convertExpression(binExpr.left),
              B: this.convertExpression(binExpr.right)
            }
          };
        }
        break;

      case ASTNodeType.UNARY_EXPRESSION:
        const unaryExpr = expr as UnaryExpression;
        if (unaryExpr.operator === '!') {
          return {
            type: 'logic_negate',
            fields: {},
            inputs: {
              BOOL: this.convertExpression(unaryExpr.argument)
            }
          };
        }
        break;
    }

    // 默認情況：使用萬用表達式積木
    return {
      type: 'arduino_raw_expression',
      fields: { CODE: this.expressionToString(expr) }
    };
  }

  // 工具方法

  /**
   * 判斷是否為簡單重複迴圈
   */
  private isSimpleRepeatLoop(stmt: ForStatement): boolean {
    if (!stmt.init || !stmt.test || !stmt.update) return false;

    // 檢查初始化: int i = 0
    if (stmt.init.type !== ASTNodeType.VARIABLE_DECLARATION) return false;
    const init = stmt.init as VariableDeclaration;
    if (!init.initializer || init.initializer.type !== ASTNodeType.LITERAL) return false;
    if ((init.initializer as Literal).value !== 0) return false;

    // 檢查條件: i < n
    if (stmt.test.type !== ASTNodeType.BINARY_EXPRESSION) return false;
    const test = stmt.test as BinaryExpression;
    if (test.operator !== '<') return false;

    // 檢查更新: i++
    if (stmt.update.type !== ASTNodeType.UNARY_EXPRESSION) return false;
    const update = stmt.update as UnaryExpression;
    if (!update.operator.includes('++')) return false;

    return true;
  }

  /**
   * 提取重複次數
   */
  private extractRepeatTimes(stmt: ForStatement): Expression | null {
    if (stmt.test && stmt.test.type === ASTNodeType.BINARY_EXPRESSION) {
      return (stmt.test as BinaryExpression).right;
    }
    return null;
  }

  /**
   * 獲取變數名稱
   */
  private getVariableName(expr: Expression): string {
    if (expr.type === ASTNodeType.IDENTIFIER) {
      return (expr as Identifier).name;
    }
    return 'variable';
  }

  /**
   * 表達式轉字串
   */
  private expressionToString(expr: Expression): string {
    switch (expr.type) {
      case ASTNodeType.LITERAL:
        return (expr as Literal).raw;
      case ASTNodeType.IDENTIFIER:
        return (expr as Identifier).name;
      case ASTNodeType.ARDUINO_PIN:
        return (expr as ArduinoPin).pin;
      case ASTNodeType.MEMBER_EXPRESSION:
        const memberExpr = expr as MemberExpression;
        return `${this.expressionToString(memberExpr.object)}.${memberExpr.property.name}`;
      case ASTNodeType.BINARY_EXPRESSION:
        const binExpr = expr as BinaryExpression;
        return `${this.expressionToString(binExpr.left)} ${binExpr.operator} ${this.expressionToString(binExpr.right)}`;
      case ASTNodeType.UNARY_EXPRESSION:
        const unaryExpr = expr as UnaryExpression;
        return `${unaryExpr.operator}${this.expressionToString(unaryExpr.argument)}`;
      case ASTNodeType.CALL_EXPRESSION:
        return this.callExpressionToString(expr as CallExpression);
      default:
        console.warn(`Unhandled expression type in expressionToString: ${(expr as any).type}`);
        return `/* unknown: ${(expr as any).type} */`;
    }
  }

  /**
   * 函數調用轉字串
   */
  private callExpressionToString(expr: CallExpression): string {
    const callee = this.expressionToString(expr.callee);
    const args = expr.arguments.map(arg => this.expressionToString(arg)).join(', ');
    return `${callee}(${args})`;
  }

  /**
   * for語句轉字串
   */
  private forStatementToString(stmt: ForStatement): string {
    const init = stmt.init ? this.expressionToString(stmt.init as any) : '';
    const test = stmt.test ? this.expressionToString(stmt.test) : '';
    const update = stmt.update ? this.expressionToString(stmt.update) : '';
    return `for (${init}; ${test}; ${update})`;
  }
}