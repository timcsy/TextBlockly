"use strict";
/**
 * AST to Blockly 轉換器
 * 將AST節點轉換為Blockly積木結構
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASTToBlocks = void 0;
const ArduinoAST_1 = require("./ArduinoAST");
class ASTToBlocks {
    /**
     * 轉換程式為Blockly工作區
     */
    convertProgram(ast) {
        const workspace = {
            setupBlocks: [],
            loopBlocks: [],
            globalVariables: []
        };
        for (const node of ast.body) {
            if (node.type === ArduinoAST_1.ASTNodeType.FUNCTION_DECLARATION) {
                const func = node;
                if (func.name.name === 'setup') {
                    workspace.setupBlocks = this.convertBlockStatement(func.body);
                }
                else if (func.name.name === 'loop') {
                    workspace.loopBlocks = this.convertBlockStatement(func.body);
                }
            }
            else if (node.type === ArduinoAST_1.ASTNodeType.VARIABLE_DECLARATION) {
                workspace.globalVariables.push(this.convertVariableDeclaration(node));
            }
        }
        return workspace;
    }
    /**
     * 轉換區塊語句
     */
    convertBlockStatement(block) {
        const blocks = [];
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
    convertStatement(statement) {
        switch (statement.type) {
            case ArduinoAST_1.ASTNodeType.EXPRESSION_STATEMENT:
                return this.convertExpressionStatement(statement);
            case ArduinoAST_1.ASTNodeType.IF_STATEMENT:
                return this.convertIfStatement(statement);
            case ArduinoAST_1.ASTNodeType.FOR_STATEMENT:
                return this.convertForStatement(statement);
            case ArduinoAST_1.ASTNodeType.WHILE_STATEMENT:
                return this.convertWhileStatement(statement);
            case ArduinoAST_1.ASTNodeType.BLOCK_STATEMENT:
                // 對於嵌套的區塊語句，我們需要特殊處理
                // 這裡簡化為返回null，實際應用中可能需要更複雜的邏輯
                return null;
            case ArduinoAST_1.ASTNodeType.VARIABLE_DECLARATION:
                return this.convertVariableDeclaration(statement);
            default:
                console.warn(`Unhandled statement type: ${statement.type}`);
                return null;
        }
    }
    /**
     * 轉換表達式語句
     */
    convertExpressionStatement(stmt) {
        const expression = stmt.expression;
        // 函數調用
        if (expression.type === ArduinoAST_1.ASTNodeType.CALL_EXPRESSION) {
            const callExpr = expression;
            return this.convertCallExpression(callExpr);
        }
        // 賦值表達式
        if (expression.type === ArduinoAST_1.ASTNodeType.ASSIGNMENT_EXPRESSION) {
            const assignExpr = expression;
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
    convertIfStatement(stmt) {
        const result = {
            type: 'controls_if',
            fields: {},
            inputs: {
                IF0: this.convertExpression(stmt.test),
                DO0: stmt.consequent.type === ArduinoAST_1.ASTNodeType.BLOCK_STATEMENT
                    ? this.convertBlockStatement(stmt.consequent)
                    : [this.convertStatement(stmt.consequent)].filter(Boolean)
            }
        };
        if (stmt.alternate) {
            result.inputs.ELSE = stmt.alternate.type === ArduinoAST_1.ASTNodeType.BLOCK_STATEMENT
                ? this.convertBlockStatement(stmt.alternate)
                : [this.convertStatement(stmt.alternate)].filter(Boolean);
        }
        return result;
    }
    /**
     * 轉換for語句
     */
    convertForStatement(stmt) {
        // 檢查是否為簡單的重複迴圈 for(int i = 0; i < n; i++)
        if (this.isSimpleRepeatLoop(stmt)) {
            const times = this.extractRepeatTimes(stmt);
            return {
                type: 'controls_repeat_ext',
                fields: {},
                inputs: {
                    TIMES: times ? this.convertExpression(times) : { type: 'math_number', fields: { NUM: 10 } },
                    DO: stmt.body.type === ArduinoAST_1.ASTNodeType.BLOCK_STATEMENT
                        ? this.convertBlockStatement(stmt.body)
                        : [this.convertStatement(stmt.body)].filter(Boolean)
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
    convertWhileStatement(stmt) {
        return {
            type: 'controls_whileUntil',
            fields: { MODE: 'WHILE' },
            inputs: {
                BOOL: this.convertExpression(stmt.test),
                DO: stmt.body.type === ArduinoAST_1.ASTNodeType.BLOCK_STATEMENT
                    ? this.convertBlockStatement(stmt.body)
                    : [this.convertStatement(stmt.body)].filter(Boolean)
            }
        };
    }
    /**
     * 轉換變數宣告
     */
    convertVariableDeclaration(decl) {
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
        }
        else {
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
    convertAssignmentExpression(expr) {
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
    convertCallExpression(expr) {
        const callee = expr.callee;
        if (callee.type === ArduinoAST_1.ASTNodeType.IDENTIFIER) {
            const funcName = callee.name;
            switch (funcName) {
                case 'digitalWrite':
                    if (expr.arguments.length === 2) {
                        const [pin, state] = expr.arguments;
                        // 檢查state是否為HIGH/LOW常數
                        if (state.type === ArduinoAST_1.ASTNodeType.LITERAL &&
                            ['HIGH', 'LOW'].includes(state.value)) {
                            return {
                                type: 'arduino_digitalwrite',
                                fields: {
                                    STATE: state.value
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
                        if (mode.type === ArduinoAST_1.ASTNodeType.LITERAL &&
                            ['INPUT', 'OUTPUT', 'INPUT_PULLUP'].includes(mode.value)) {
                            return {
                                type: 'arduino_pinmode',
                                fields: {
                                    MODE: mode.value
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
                        if (timeArg.type === ArduinoAST_1.ASTNodeType.LITERAL) {
                            return {
                                type: 'arduino_delay',
                                fields: {
                                    TIME: timeArg.value
                                }
                            };
                        }
                    }
                    break;
                case 'delayMicroseconds':
                    if (expr.arguments.length === 1) {
                        const timeArg = expr.arguments[0];
                        if (timeArg.type === ArduinoAST_1.ASTNodeType.LITERAL) {
                            return {
                                type: 'arduino_delayMicroseconds',
                                fields: {
                                    TIME: timeArg.value
                                }
                            };
                        }
                    }
                    break;
            }
        }
        // 處理Serial.print等成員函數調用
        if (callee.type === ArduinoAST_1.ASTNodeType.MEMBER_EXPRESSION) {
            const memberExpr = callee;
            if (memberExpr.object.type === ArduinoAST_1.ASTNodeType.IDENTIFIER &&
                memberExpr.object.name === 'Serial') {
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
    convertExpression(expr) {
        switch (expr.type) {
            case ArduinoAST_1.ASTNodeType.LITERAL:
                const literal = expr;
                if (typeof literal.value === 'number') {
                    return {
                        type: 'math_number',
                        fields: { NUM: literal.value }
                    };
                }
                else if (typeof literal.value === 'string') {
                    if (['HIGH', 'LOW', 'true', 'false'].includes(literal.value)) {
                        return {
                            type: 'logic_boolean',
                            fields: { BOOL: literal.value === 'HIGH' || literal.value === 'true' ? 'TRUE' : 'FALSE' }
                        };
                    }
                    else {
                        return {
                            type: 'text',
                            fields: { TEXT: literal.value }
                        };
                    }
                }
                break;
            case ArduinoAST_1.ASTNodeType.IDENTIFIER:
                return {
                    type: 'variables_get',
                    fields: { VAR: expr.name }
                };
            case ArduinoAST_1.ASTNodeType.ARDUINO_PIN:
                const pin = expr;
                return {
                    type: 'arduino_raw_expression',
                    fields: { CODE: pin.pin }
                };
            case ArduinoAST_1.ASTNodeType.CALL_EXPRESSION:
                const callExpr = expr;
                // 檢查是否為Arduino讀取函數
                if (callExpr.callee.type === ArduinoAST_1.ASTNodeType.IDENTIFIER) {
                    const funcName = callExpr.callee.name;
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
                }
                // 其他函數調用，使用萬用表達式
                return {
                    type: 'arduino_raw_expression',
                    fields: { CODE: this.callExpressionToString(callExpr) }
                };
            case ArduinoAST_1.ASTNodeType.BINARY_EXPRESSION:
                const binExpr = expr;
                // 數學運算
                const mathOps = {
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
                const compareOps = {
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
            case ArduinoAST_1.ASTNodeType.UNARY_EXPRESSION:
                const unaryExpr = expr;
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
    isSimpleRepeatLoop(stmt) {
        if (!stmt.init || !stmt.test || !stmt.update)
            return false;
        // 檢查初始化: int i = 0
        if (stmt.init.type !== ArduinoAST_1.ASTNodeType.VARIABLE_DECLARATION)
            return false;
        const init = stmt.init;
        if (!init.initializer || init.initializer.type !== ArduinoAST_1.ASTNodeType.LITERAL)
            return false;
        if (init.initializer.value !== 0)
            return false;
        // 檢查條件: i < n
        if (stmt.test.type !== ArduinoAST_1.ASTNodeType.BINARY_EXPRESSION)
            return false;
        const test = stmt.test;
        if (test.operator !== '<')
            return false;
        // 檢查更新: i++
        if (stmt.update.type !== ArduinoAST_1.ASTNodeType.UNARY_EXPRESSION)
            return false;
        const update = stmt.update;
        if (!update.operator.includes('++'))
            return false;
        return true;
    }
    /**
     * 提取重複次數
     */
    extractRepeatTimes(stmt) {
        if (stmt.test && stmt.test.type === ArduinoAST_1.ASTNodeType.BINARY_EXPRESSION) {
            return stmt.test.right;
        }
        return null;
    }
    /**
     * 獲取變數名稱
     */
    getVariableName(expr) {
        if (expr.type === ArduinoAST_1.ASTNodeType.IDENTIFIER) {
            return expr.name;
        }
        return 'variable';
    }
    /**
     * 表達式轉字串
     */
    expressionToString(expr) {
        switch (expr.type) {
            case ArduinoAST_1.ASTNodeType.LITERAL:
                return expr.raw;
            case ArduinoAST_1.ASTNodeType.IDENTIFIER:
                return expr.name;
            case ArduinoAST_1.ASTNodeType.ARDUINO_PIN:
                return expr.pin;
            case ArduinoAST_1.ASTNodeType.MEMBER_EXPRESSION:
                const memberExpr = expr;
                return `${this.expressionToString(memberExpr.object)}.${memberExpr.property.name}`;
            case ArduinoAST_1.ASTNodeType.BINARY_EXPRESSION:
                const binExpr = expr;
                return `${this.expressionToString(binExpr.left)} ${binExpr.operator} ${this.expressionToString(binExpr.right)}`;
            case ArduinoAST_1.ASTNodeType.UNARY_EXPRESSION:
                const unaryExpr = expr;
                return `${unaryExpr.operator}${this.expressionToString(unaryExpr.argument)}`;
            case ArduinoAST_1.ASTNodeType.CALL_EXPRESSION:
                return this.callExpressionToString(expr);
            default:
                console.warn(`Unhandled expression type in expressionToString: ${expr.type}`);
                return `/* unknown: ${expr.type} */`;
        }
    }
    /**
     * 函數調用轉字串
     */
    callExpressionToString(expr) {
        const callee = this.expressionToString(expr.callee);
        const args = expr.arguments.map(arg => this.expressionToString(arg)).join(', ');
        return `${callee}(${args})`;
    }
    /**
     * for語句轉字串
     */
    forStatementToString(stmt) {
        const init = stmt.init ? this.expressionToString(stmt.init) : '';
        const test = stmt.test ? this.expressionToString(stmt.test) : '';
        const update = stmt.update ? this.expressionToString(stmt.update) : '';
        return `for (${init}; ${test}; ${update})`;
    }
}
exports.ASTToBlocks = ASTToBlocks;
