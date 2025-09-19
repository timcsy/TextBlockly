import * as vscode from 'vscode';

export interface ParsedBlock {
  type: string;
  fields: { [key: string]: any };
  inputs: { [key: string]: any };
}

export interface ParsedWorkspace {
  setupBlocks: ParsedBlock[];
  loopBlocks: ParsedBlock[];
}

export class ArduinoCodeParser {
  /**
   * 解析 Arduino 程式碼並轉換為 Blockly 積木結構
   */
  public parseCode(code: string): ParsedWorkspace {
    console.log('Parsing Arduino code:', code.substring(0, 100));

    const setupBlocks = this.parseSetupFunction(code);
    const loopBlocks = this.parseLoopFunction(code);

    return {
      setupBlocks,
      loopBlocks
    };
  }

  /**
   * 解析 setup() 函數內容
   */
  private parseSetupFunction(code: string): ParsedBlock[] {
    // 更靈活的 setup 函數匹配，支援多行和嵌套結構
    const setupMatch = this.extractFunctionBody(code, 'setup');
    if (!setupMatch) {
      console.log('No setup() function found in code');
      return [];
    }

    console.log('Setup function content:', setupMatch.substring(0, 100));
    const blocks = this.parseCodeBlock(setupMatch);
    console.log('Parsed setup blocks:', blocks);
    return blocks;
  }

  /**
   * 解析 loop() 函數內容
   */
  private parseLoopFunction(code: string): ParsedBlock[] {
    // 更靈活的 loop 函數匹配，支援多行和嵌套結構
    const loopMatch = this.extractFunctionBody(code, 'loop');
    if (!loopMatch) {
      console.log('No loop() function found in code');
      return [];
    }

    console.log('Loop function content:', loopMatch.substring(0, 100));
    const blocks = this.parseCodeBlock(loopMatch);
    console.log('Parsed loop blocks:', blocks);
    return blocks;
  }

  /**
   * 解析程式碼區塊，識別 Arduino 函數並轉換為積木
   */
  private parseCodeBlock(codeBlock: string): ParsedBlock[] {
    // 清理程式碼，移除註解但保留結構
    const cleanCode = this.cleanCode(codeBlock);

    // 嘗試解析結構化語句
    const structuredBlocks = this.parseStructuredStatements(cleanCode);

    return structuredBlocks.length > 0 ? structuredBlocks : this.parseSimpleStatements(cleanCode);
  }

  /**
   * 清理程式碼，移除註解並標準化空白
   */
  private cleanCode(code: string): string {
    return code
      .replace(/\/\/.*$/gm, '') // 移除行註解
      .replace(/\/\*[\s\S]*?\*\//g, '') // 移除區塊註解
      .replace(/\s*\n\s*/g, '\n') // 保留換行但清理空白
      .replace(/\s{2,}/g, ' ') // 多個空格合併為一個
      .trim();
  }

  /**
   * 解析結構化語句（if, for, while 等）
   */
  private parseStructuredStatements(code: string): ParsedBlock[] {
    const blocks: ParsedBlock[] = [];

    // 直接嘗試匹配結構化語句
    const ifMatches = this.findCompleteStatements(code, 'if');
    const forMatches = this.findCompleteStatements(code, 'for');
    const whileMatches = this.findCompleteStatements(code, 'while');

    // 收集所有結構化語句及其位置
    const allStructures: Array<{ start: number; end: number; type: string; content: string }> = [];

    ifMatches.forEach(match => {
      allStructures.push({ start: match.index, end: match.index + match.full.length, type: 'if', content: match.full });
    });

    forMatches.forEach(match => {
      allStructures.push({ start: match.index, end: match.index + match.full.length, type: 'for', content: match.full });
    });

    whileMatches.forEach(match => {
      allStructures.push({ start: match.index, end: match.index + match.full.length, type: 'while', content: match.full });
    });

    // 按位置排序
    allStructures.sort((a, b) => a.start - b.start);

    // 解析結構化語句
    for (const structure of allStructures) {
      let block: ParsedBlock | null = null;

      if (structure.type === 'if') {
        block = this.parseIfStatement(structure.content);
      } else if (structure.type === 'for') {
        block = this.parseForStatement(structure.content);
      } else if (structure.type === 'while') {
        block = this.parseWhileStatement(structure.content);
      }

      if (block) {
        blocks.push(block);
      }
    }

    // 如果找到了結構化語句，只解析剩餘的簡單語句
    if (allStructures.length > 0) {
      // 解析剩餘的簡單語句（去掉已處理的結構化語句）
      let remainingCode = code;
      for (const structure of allStructures.reverse()) {
        remainingCode = remainingCode.slice(0, structure.start) + remainingCode.slice(structure.end);
      }

      // 只解析真正剩餘的簡單語句
      const simpleBlocks = this.parseSimpleStatements(remainingCode.trim());
      blocks.push(...simpleBlocks);
    }

    return blocks;
  }

  /**
   * 解析 if 語句
   */
  private parseIfStatement(statement: string): ParsedBlock | null {
    try {
      // 使用更強大的方法來提取 if 語句的各部分
      const conditionMatch = statement.match(/if\s*\(([^)]*(?:\([^)]*\)[^)]*)*)\)/);
      if (!conditionMatch) return null;

      const condition = conditionMatch[1].trim();
      const afterCondition = statement.substring(conditionMatch[0].length).trim();

      // 提取 if 主體
      const ifBody = this.extractBlockBody(afterCondition);
      if (!ifBody) return null;

      // 檢查是否有 else - 需要正確計算 if 主體的結束位置
      let remainingCode = '';
      const ifBodyStart = afterCondition.indexOf('{');
      if (ifBodyStart !== -1) {
        // 找到 if 主體的結束位置（匹配的 }）
        let braceCount = 1;
        let ifBodyEnd = -1;
        for (let i = ifBodyStart + 1; i < afterCondition.length; i++) {
          if (afterCondition[i] === '{') braceCount++;
          if (afterCondition[i] === '}') braceCount--;
          if (braceCount === 0) {
            ifBodyEnd = i;
            break;
          }
        }
        if (ifBodyEnd !== -1) {
          remainingCode = afterCondition.substring(ifBodyEnd + 1).trim();
        }
      }

      let elseBody = null;
      if (remainingCode.startsWith('else')) {
        const elseCode = remainingCode.substring(4).trim();
        elseBody = this.extractBlockBody(elseCode);
      }

      const conditionBlock = this.parseCondition(condition);

      const result: ParsedBlock = {
        type: 'controls_if',
        fields: {},
        inputs: {
          IF0: conditionBlock,
          DO0: this.parseCodeBlock(ifBody || '')
        }
      };

      if (elseBody) {
        result.inputs.ELSE = this.parseCodeBlock(elseBody);
      }

      return result;
    } catch (error) {
      console.warn('Error parsing if statement:', error);
      return null;
    }
  }

  /**
   * 解析 for 語句
   */
  private parseForStatement(statement: string): ParsedBlock | null {
    try {
      // 使用更強大的方法來提取 for 語句的各部分
      const forMatch = statement.match(/for\s*\(([^)]*)\)\s*/);
      if (!forMatch) return null;

      const forCondition = forMatch[1];
      const afterCondition = statement.substring(forMatch[0].length).trim();
      const body = this.extractBlockBody(afterCondition);
      if (!body) return null;

      // 解析 for 條件的三個部分
      const parts = forCondition.split(';').map(p => p.trim());
      if (parts.length !== 3) return null;

      const [init, condition, increment] = parts;

      // 簡單的重複迴圈：for (int i = 0; i < times; i++)
      const simpleForMatch = forCondition.match(/int\s+(\w+)\s*=\s*0\s*;\s*\1\s*<\s*(\d+|\w+)\s*;\s*\1\+\+/);
      if (simpleForMatch) {
        const times = this.validateNumber(simpleForMatch[2], '10', 0);
        return {
          type: 'controls_repeat_ext',
          fields: {},
          inputs: {
            TIMES: { type: 'math_number', fields: { NUM: times } },
            DO: this.parseCodeBlock(body)
          }
        };
      }

      // 複雜的 for 迴圈
      const varMatch = init.match(/int\s+(\w+)\s*=\s*(.+)/);
      if (!varMatch) return null;

      const variable = this.validateVariableName(varMatch[1], 'i');
      const from = this.validateNumber(varMatch[2], '1');

      // 解析結束條件
      const condMatch = condition.match(/\w+\s*<=?\s*(.+)/);
      const to = condMatch ? this.validateNumber(condMatch[1], '10') : '10';

      // 解析增量（默認為1）
      const byMatch = increment.match(/\w+\s*\+=\s*(.+)/);
      const by = byMatch ? this.validateNumber(byMatch[1], '1') : '1';

      return {
        type: 'controls_for',
        fields: { VAR: variable },
        inputs: {
          FROM: { type: 'math_number', fields: { NUM: from } },
          TO: { type: 'math_number', fields: { NUM: to } },
          BY: { type: 'math_number', fields: { NUM: by } },
          DO: this.parseCodeBlock(body)
        }
      };
    } catch (error) {
      console.warn('Error parsing for statement:', error);
      return null;
    }
  }

  /**
   * 解析 while 語句
   */
  private parseWhileStatement(statement: string): ParsedBlock | null {
    const whileMatch = statement.match(/while\s*\(([^)]+)\)\s*\{([^}]*)\}/);
    if (!whileMatch) return null;

    const condition = whileMatch[1].trim();
    const body = whileMatch[2].trim();

    const conditionBlock = this.parseCondition(condition);

    return {
      type: 'controls_whileUntil',
      fields: { MODE: 'WHILE' },
      inputs: {
        BOOL: conditionBlock,
        DO: this.parseCodeBlock(body)
      }
    };
  }

  /**
   * 解析條件表達式
   */
  private parseCondition(condition: string): ParsedBlock | null {
    // 比較運算子
    const compareMatch = condition.match(/(.+?)\s*(==|!=|<=|>=|<|>)\s*(.+)/);
    if (compareMatch) {
      const left = compareMatch[1].trim();
      const operator = compareMatch[2];
      const right = compareMatch[3].trim();

      const operatorMap: { [key: string]: string } = {
        '==': 'EQ',
        '!=': 'NEQ',
        '<': 'LT',
        '<=': 'LTE',
        '>': 'GT',
        '>=': 'GTE'
      };

      return {
        type: 'logic_compare',
        fields: { OP: operatorMap[operator] || 'EQ' },
        inputs: {
          A: this.parseValue(left),
          B: this.parseValue(right)
        }
      };
    }

    // 邏輯運算子
    const logicMatch = condition.match(/(.+?)\s*(&&|\|\|)\s*(.+)/);
    if (logicMatch) {
      const left = logicMatch[1].trim();
      const operator = logicMatch[2];
      const right = logicMatch[3].trim();

      return {
        type: 'logic_operation',
        fields: { OP: operator === '&&' ? 'AND' : 'OR' },
        inputs: {
          A: this.parseCondition(left),
          B: this.parseCondition(right)
        }
      };
    }

    // 否定
    const negateMatch = condition.match(/!\s*\((.+)\)/);
    if (negateMatch) {
      return {
        type: 'logic_negate',
        fields: {},
        inputs: {
          BOOL: this.parseCondition(negateMatch[1])
        }
      };
    }

    // 布林值
    if (condition === 'true' || condition === 'false') {
      return {
        type: 'logic_boolean',
        fields: { BOOL: condition.toUpperCase() },
        inputs: {}
      };
    }

    // 函數調用（如 digitalRead）
    return this.parseValue(condition);
  }

  /**
   * 解析表達式 - 改進版的parseValue，支援更多表達式類型
   */
  private parseExpression(expr: string): ParsedBlock | null {
    expr = expr.trim();
    if (!expr) return null;

    // 1. 數字 (整數和小數)
    if (/^\d+(\.\d+)?$/.test(expr)) {
      return {
        type: 'math_number',
        fields: { NUM: parseFloat(expr) },
        inputs: {}
      };
    }

    // 2. 字串 (用引號包圍)
    if (/^["'].*["']$/.test(expr)) {
      return {
        type: 'text',
        fields: { TEXT: expr.slice(1, -1) },
        inputs: {}
      };
    }

    // 3. Arduino常數
    if (/^(HIGH|LOW|true|false|INPUT|OUTPUT|INPUT_PULLUP)$/i.test(expr)) {
      const boolValue = ['HIGH', 'true', 'INPUT', 'OUTPUT', 'INPUT_PULLUP'].includes(expr.toUpperCase());
      return {
        type: 'logic_boolean',
        fields: { BOOL: boolValue ? 'TRUE' : 'FALSE' },
        inputs: {}
      };
    }

    // 4. Arduino類比腳位 (A0, A1, etc.)
    if (/^A\d+$/.test(expr)) {
      return {
        type: 'arduino_raw_expression',
        fields: { CODE: expr },
        inputs: {}
      };
    }

    // 5. digitalRead(pin)
    const digitalReadMatch = expr.match(/^digitalRead\s*\(\s*([^)]+)\s*\)$/);
    if (digitalReadMatch) {
      const pin = digitalReadMatch[1].trim();
      return {
        type: 'arduino_digitalread',
        fields: {},
        inputs: {
          PIN: this.parseExpression(pin)
        }
      };
    }

    // 6. analogRead(pin)
    const analogReadMatch = expr.match(/^analogRead\s*\(\s*([^)]+)\s*\)$/);
    if (analogReadMatch) {
      const pin = analogReadMatch[1].trim();
      return {
        type: 'arduino_analogread',
        fields: {},
        inputs: {
          PIN: this.parseExpression(pin)
        }
      };
    }

    // 7. 數學運算 (+, -, *, /, %)
    const mathOpMatch = expr.match(/^(.+?)\s*([+\-*/%])\s*(.+)$/);
    if (mathOpMatch) {
      const left = mathOpMatch[1].trim();
      const operator = mathOpMatch[2];
      const right = mathOpMatch[3].trim();

      const opMap: { [key: string]: string } = {
        '+': 'ADD',
        '-': 'MINUS',
        '*': 'MULTIPLY',
        '/': 'DIVIDE',
        '%': 'MODULO'
      };

      return {
        type: 'math_arithmetic',
        fields: { OP: opMap[operator] || 'ADD' },
        inputs: {
          A: this.parseExpression(left),
          B: this.parseExpression(right)
        }
      };
    }

    // 8. 比較運算 (==, !=, >, <, >=, <=)
    const compareMatch = expr.match(/^(.+?)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
    if (compareMatch) {
      const left = compareMatch[1].trim();
      const operator = compareMatch[2];
      const right = compareMatch[3].trim();

      const opMap: { [key: string]: string } = {
        '==': 'EQ',
        '!=': 'NEQ',
        '>': 'GT',
        '<': 'LT',
        '>=': 'GTE',
        '<=': 'LTE'
      };

      return {
        type: 'logic_compare',
        fields: { OP: opMap[operator] || 'EQ' },
        inputs: {
          A: this.parseExpression(left),
          B: this.parseExpression(right)
        }
      };
    }

    // 9. 邏輯運算 (&&, ||)
    const logicMatch = expr.match(/^(.+?)\s*(&&|\|\|)\s*(.+)$/);
    if (logicMatch) {
      const left = logicMatch[1].trim();
      const operator = logicMatch[2];
      const right = logicMatch[3].trim();

      return {
        type: 'logic_operation',
        fields: { OP: operator === '&&' ? 'AND' : 'OR' },
        inputs: {
          A: this.parseExpression(left),
          B: this.parseExpression(right)
        }
      };
    }

    // 10. 邏輯非 (!expr)
    const notMatch = expr.match(/^!\s*(.+)$/);
    if (notMatch) {
      const innerExpr = notMatch[1].trim();
      return {
        type: 'logic_negate',
        fields: {},
        inputs: {
          BOOL: this.parseExpression(innerExpr)
        }
      };
    }

    // 11. 變數名稱
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(expr)) {
      return {
        type: 'variables_get',
        fields: { VAR: this.validateVariableName(expr, 'var') },
        inputs: {}
      };
    }

    // 12. 函數調用 (如自定義函數)
    const functionMatch = expr.match(/^[a-zA-Z_]\w*\s*\([^)]*\)$/);
    if (functionMatch) {
      return {
        type: 'arduino_raw_expression',
        fields: { CODE: expr },
        inputs: {}
      };
    }

    // 13. 括號表達式 (expr)
    if (expr.startsWith('(') && expr.endsWith(')')) {
      const innerExpr = expr.slice(1, -1).trim();
      return this.parseExpression(innerExpr);
    }

    // 14. 無法識別的表達式 - 使用萬用表達式積木
    console.log('Unable to parse expression, using raw expression block:', expr);
    return {
      type: 'arduino_raw_expression',
      fields: { CODE: expr },
      inputs: {}
    };
  }

  /**
   * 解析值表達式 (保持向後相容)
   */
  private parseValue(value: string): ParsedBlock | null {
    return this.parseExpression(value);
  }

  /**
   * 原始parseValue方法的備份版本
   */
  private parseValueOriginal(value: string): ParsedBlock | null {
    value = value.trim();

    // 數字
    if (/^\d+(\.\d+)?$/.test(value)) {
      return {
        type: 'math_number',
        fields: { NUM: this.validateNumber(value, '0') },
        inputs: {}
      };
    }

    // digitalRead 函數
    const digitalReadMatch = value.match(/digitalRead\s*\(\s*(\d+)\s*\)/);
    if (digitalReadMatch) {
      return {
        type: 'arduino_digitalread',
        fields: { PIN: this.validateNumber(digitalReadMatch[1], '2', 0, 53) },
        inputs: {}
      };
    }

    // analogRead 函數
    const analogReadMatch = value.match(/analogRead\s*\(\s*(A?\d+)\s*\)/);
    if (analogReadMatch) {
      const pin = analogReadMatch[1];
      const validPin = /^A[0-5]$/.test(pin) ? pin : 'A0';
      return {
        type: 'arduino_analogread',
        fields: { PIN: validPin },
        inputs: {}
      };
    }

    // 變數
    if (/^[a-zA-Z_]\w*$/.test(value)) {
      return {
        type: 'variables_get',
        fields: { VAR: this.validateVariableName(value, 'variable') },
        inputs: {}
      };
    }

    // 算術表達式
    const arithmeticMatch = value.match(/(.+?)\s*([+\-*/])\s*(.+)/);
    if (arithmeticMatch) {
      const left = arithmeticMatch[1].trim();
      const operator = arithmeticMatch[2];
      const right = arithmeticMatch[3].trim();

      const operatorMap: { [key: string]: string } = {
        '+': 'ADD',
        '-': 'MINUS',
        '*': 'MULTIPLY',
        '/': 'DIVIDE'
      };

      return {
        type: 'math_arithmetic',
        fields: { OP: operatorMap[operator] || 'ADD' },
        inputs: {
          A: this.parseValue(left),
          B: this.parseValue(right)
        }
      };
    }

    // Arduino 常數 (HIGH, LOW, etc.)
    if (/^(HIGH|LOW|true|false)$/i.test(value)) {
      const boolValue = value.toUpperCase() === 'HIGH' || value.toLowerCase() === 'true';
      return {
        type: 'logic_boolean',
        fields: { BOOL: boolValue ? 'TRUE' : 'FALSE' },
        inputs: {}
      };
    }

    // 變數名稱
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
      return {
        type: 'variables_get',
        fields: { VAR: this.validateVariableName(value, 'var') },
        inputs: {}
      };
    }

    return null;
  }

  /**
   * 解析單個語句並轉換為積木
   */
  private parseStatement(statement: string): ParsedBlock | null {
    // 移除分號
    const cleanStatement = statement.replace(/;$/, '').trim();
    if (!cleanStatement) return null;

    // 1. 變數宣告與定義 (int var = value) - 使用 variables_define
    const varDefineMatch = cleanStatement.match(/^(int|float|char|boolean|String)\s+([a-zA-Z_]\w*)\s*=\s*(.+)$/);
    if (varDefineMatch) {
      const type = varDefineMatch[1];
      const variable = this.validateVariableName(varDefineMatch[2], 'variable');
      const value = varDefineMatch[3];

      return {
        type: 'variables_define',
        fields: {
          TYPE: type,
          VAR: variable
        },
        inputs: {
          VALUE: this.parseExpression(value)
        }
      };
    }

    // 2. 變數宣告 (int var) - 使用 variables_declare
    const varDeclareMatch = cleanStatement.match(/^(int|float|char|boolean|String)\s+([a-zA-Z_]\w*)$/);
    if (varDeclareMatch) {
      const type = varDeclareMatch[1];
      const variable = this.validateVariableName(varDeclareMatch[2], 'variable');

      return {
        type: 'variables_declare',
        fields: {
          TYPE: type,
          VAR: variable
        },
        inputs: {}
      };
    }

    // 3. 變數賦值
    const variableAssignMatch = cleanStatement.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);
    if (variableAssignMatch) {
      const variable = this.validateVariableName(variableAssignMatch[1], 'variable');
      const value = variableAssignMatch[2];

      return {
        type: 'variables_set',
        fields: { VAR: variable },
        inputs: {
          VALUE: this.parseExpression(value)
        }
      };
    }

    // 4. digitalWrite(pin, state) - 支援表達式輸入
    const digitalWriteMatch = cleanStatement.match(/digitalWrite\s*\(\s*([^,]+)\s*,\s*(HIGH|LOW|0|1|\d+|[a-zA-Z_]\w*)\s*\)/);
    if (digitalWriteMatch) {
      const pin = digitalWriteMatch[1].trim();
      let state = digitalWriteMatch[2].trim();

      // 標準化狀態值
      if (state === '1') state = 'HIGH';
      if (state === '0') state = 'LOW';

      // 如果狀態是 HIGH/LOW，使用下拉選單，否則使用表達式
      if (state === 'HIGH' || state === 'LOW') {
        return {
          type: 'arduino_digitalwrite',
          fields: { STATE: state },
          inputs: {
            PIN: this.parseExpression(pin)
          }
        };
      } else {
        // 使用萬用積木處理非標準狀態
        return {
          type: 'arduino_raw_statement',
          fields: { CODE: cleanStatement },
          inputs: {}
        };
      }
    }

    // 5. digitalRead(pin)
    const digitalReadMatch = cleanStatement.match(/digitalRead\s*\(\s*([^)]+)\s*\)/);
    if (digitalReadMatch) {
      // digitalRead 通常在表達式中使用，但如果單獨一行，使用萬用積木
      return {
        type: 'arduino_raw_statement',
        fields: { CODE: cleanStatement },
        inputs: {}
      };
    }

    // 6. pinMode(pin, mode) - 支援表達式輸入
    const pinModeMatch = cleanStatement.match(/pinMode\s*\(\s*([^,]+)\s*,\s*(INPUT|OUTPUT|INPUT_PULLUP)\s*\)/);
    if (pinModeMatch) {
      const pin = pinModeMatch[1].trim();
      const mode = pinModeMatch[2];

      return {
        type: 'arduino_pinmode',
        fields: { MODE: mode },
        inputs: {
          PIN: this.parseExpression(pin)
        }
      };
    }

    // 7. analogWrite(pin, value) - 支援表達式輸入
    const analogWriteMatch = cleanStatement.match(/analogWrite\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/);
    if (analogWriteMatch) {
      const pin = analogWriteMatch[1].trim();
      const value = analogWriteMatch[2].trim();

      return {
        type: 'arduino_analogwrite',
        fields: {},
        inputs: {
          PIN: this.parseExpression(pin),
          VALUE: this.parseExpression(value)
        }
      };
    }

    // 8. analogRead(pin)
    const analogReadMatch = cleanStatement.match(/analogRead\s*\(\s*([^)]+)\s*\)/);
    if (analogReadMatch) {
      // analogRead 通常在表達式中使用，但如果單獨一行，使用萬用積木
      return {
        type: 'arduino_raw_statement',
        fields: { CODE: cleanStatement },
        inputs: {}
      };
    }

    // 9. delay(time) - 支援表達式輸入
    const delayMatch = cleanStatement.match(/delay\s*\(\s*([^)]+)\s*\)/);
    if (delayMatch) {
      const time = delayMatch[1].trim();

      // 如果是純數字，使用 field，否則使用 input
      if (/^\d+$/.test(time)) {
        return {
          type: 'arduino_delay',
          fields: { TIME: parseInt(time) },
          inputs: {}
        };
      } else {
        // 使用萬用積木處理表達式延遲
        return {
          type: 'arduino_raw_statement',
          fields: { CODE: cleanStatement },
          inputs: {}
        };
      }
    }

    // 10. delayMicroseconds(time) - 支援表達式輸入
    const delayMicroMatch = cleanStatement.match(/delayMicroseconds\s*\(\s*([^)]+)\s*\)/);
    if (delayMicroMatch) {
      const time = delayMicroMatch[1].trim();

      // 如果是純數字，使用 field，否則使用萬用積木
      if (/^\d+$/.test(time)) {
        return {
          type: 'arduino_delayMicroseconds',
          fields: { TIME: parseInt(time) },
          inputs: {}
        };
      } else {
        return {
          type: 'arduino_raw_statement',
          fields: { CODE: cleanStatement },
          inputs: {}
        };
      }
    }

    // 11. Serial.begin(baudrate)
    const serialBeginMatch = cleanStatement.match(/Serial\.begin\s*\(\s*([^)]+)\s*\)/);
    if (serialBeginMatch) {
      return {
        type: 'arduino_raw_statement',
        fields: { CODE: cleanStatement },
        inputs: {}
      };
    }

    // 12. Serial.print/println
    const serialPrintMatch = cleanStatement.match(/Serial\.(print|println)\s*\(\s*(.+)\s*\)/);
    if (serialPrintMatch) {
      return {
        type: 'arduino_raw_statement',
        fields: { CODE: cleanStatement },
        inputs: {}
      };
    }

    // 13. 函數調用 (function())
    const functionCallMatch = cleanStatement.match(/^[a-zA-Z_]\w*\s*\([^)]*\)$/);
    if (functionCallMatch) {
      return {
        type: 'arduino_raw_statement',
        fields: { CODE: cleanStatement },
        inputs: {}
      };
    }

    // 14. 其他複合語句或無法識別的語句 - 使用萬用積木
    console.log('Unable to parse statement, using raw code block:', cleanStatement);
    return {
      type: 'arduino_raw_statement',
      fields: { CODE: cleanStatement },
      inputs: {}
    };
  }

  /**
   * 將解析的積木轉換為 Blockly XML
   */
  public blocksToXml(workspace: ParsedWorkspace): string {
    console.log('Converting workspace to XML:');
    console.log('- Setup blocks count:', workspace.setupBlocks.length);
    console.log('- Loop blocks count:', workspace.loopBlocks.length);
    console.log('- Loop blocks detail:', workspace.loopBlocks.map(b => `${b.type}(${JSON.stringify(b.fields)})`));

    const xmlParts: string[] = [];
    xmlParts.push('<xml xmlns="https://developers.google.com/blockly/xml">');

    // 總是添加 setup 積木，即使是空的
    xmlParts.push('  <block type="arduino_setup" x="50" y="50">');
    if (workspace.setupBlocks.length > 0) {
      xmlParts.push('    <statement name="SETUP_CODE">');

      // 生成積木鏈 - 第一個積木
      if (workspace.setupBlocks.length > 0) {
        xmlParts.push(this.generateBlockChain(workspace.setupBlocks, 6));
      }

      xmlParts.push('    </statement>');
    }
    xmlParts.push('  </block>');

    // 總是添加 loop 積木，即使是空的
    xmlParts.push('  <block type="arduino_loop" x="50" y="250">');
    if (workspace.loopBlocks.length > 0) {
      xmlParts.push('    <statement name="LOOP_CODE">');

      // 生成積木鏈 - 第一個積木
      if (workspace.loopBlocks.length > 0) {
        xmlParts.push(this.generateBlockChain(workspace.loopBlocks, 6));
      }

      xmlParts.push('    </statement>');
    }
    xmlParts.push('  </block>');

    xmlParts.push('</xml>');

    const finalXml = xmlParts.join('\n');
    console.log('Generated XML:', finalXml);
    return finalXml;
  }

  /**
   * 將單個積木轉換為 XML
   */
  private blockToXml(block: ParsedBlock, indent: number, hasNext: boolean): string {
    const spaces = ' '.repeat(indent);
    const xmlParts: string[] = [];

    xmlParts.push(`${spaces}<block type="${block.type}">`);

    // 添加字段
    for (const [fieldName, fieldValue] of Object.entries(block.fields)) {
      xmlParts.push(`${spaces}  <field name="${fieldName}">${fieldValue}</field>`);
    }

    // 添加輸入
    for (const [inputName, inputValue] of Object.entries(block.inputs)) {
      if (inputValue) {
        if (Array.isArray(inputValue)) {
          // 語句輸入（如 if 的 DO, ELSE）
          if (inputValue.length > 0) {
            xmlParts.push(`${spaces}  <statement name="${inputName}">`);
            for (let i = 0; i < inputValue.length; i++) {
              const childBlock = inputValue[i];
              const isLast = i === inputValue.length - 1;
              xmlParts.push(this.blockToXml(childBlock, indent + 4, !isLast));
            }
            xmlParts.push(`${spaces}  </statement>`);
          }
        } else if (typeof inputValue === 'object' && inputValue.type) {
          // 值輸入（如條件、數值）
          xmlParts.push(`${spaces}  <value name="${inputName}">`);
          xmlParts.push(this.blockToXml(inputValue, indent + 4, false));
          xmlParts.push(`${spaces}  </value>`);
        }
      }
    }

    // 如果有下一個積木，添加 next 標籤
    if (hasNext) {
      xmlParts.push(`${spaces}  <next>`);
      xmlParts.push(`${spaces}  </next>`);
    }

    xmlParts.push(`${spaces}</block>`);

    return xmlParts.join('\n');
  }

  /**
   * 檢查程式碼是否有效的 Arduino 程式碼
   */
  public isValidArduinoCode(code: string): boolean {
    const hasSetup = code.includes('void setup()');
    const hasLoop = code.includes('void loop()');
    console.log('Arduino code validation:');
    console.log('- Has setup():', hasSetup);
    console.log('- Has loop():', hasLoop);
    console.log('- Code preview:', code.substring(0, 200));
    return hasSetup && hasLoop;
  }

  /**
   * 比較兩段程式碼是否在結構上相似（忽略空白和註解）
   */
  public codeEquals(code1: string, code2: string): boolean {
    const normalize = (code: string) => {
      return code
        .replace(/\/\/.*$/gm, '') // 移除行註解
        .replace(/\/\*[\s\S]*?\*\//g, '') // 移除區塊註解
        .replace(/\s+/g, ' ') // 標準化空白
        .trim();
    };

    return normalize(code1) === normalize(code2);
  }

  /**
   * 提取函數主體內容，支援嵌套大括號
   */
  private extractFunctionBody(code: string, functionName: string): string | null {
    const regex = new RegExp(`void\\s+${functionName}\\s*\\(\\s*\\)\\s*\\{`, 'i');
    const match = code.match(regex);
    if (!match) return null;

    const startIndex = match.index! + match[0].length;
    let braceCount = 1;
    let index = startIndex;

    while (index < code.length && braceCount > 0) {
      const char = code[index];
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
      }
      index++;
    }

    if (braceCount === 0) {
      return code.substring(startIndex, index - 1);
    }

    return null;
  }

  /**
   * 提取程式碼區塊主體，處理嵌套大括號
   */
  private extractBlockBody(code: string): string | null {
    // 找到第一個 { 的位置
    const startBrace = code.indexOf('{');
    if (startBrace === -1) return null;

    let braceCount = 1;
    let index = startBrace + 1;

    while (index < code.length && braceCount > 0) {
      const char = code[index];
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
      }
      index++;
    }

    if (braceCount === 0) {
      return code.substring(startBrace + 1, index - 1);
    }

    return null;
  }

  /**
   * 提取頂層語句，正確處理嵌套結構
   */
  private extractTopLevelStatements(code: string): string[] {
    const statements: string[] = [];
    let currentStatement = '';
    let braceCount = 0;
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < code.length; i++) {
      const char = code[i];

      // 處理字串
      if ((char === '"' || char === "'") && !inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar && inString) {
        inString = false;
        stringChar = '';
      }

      currentStatement += char;

      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;

          if (braceCount === 0) {
            statements.push(currentStatement.trim());
            currentStatement = '';
          }
        } else if (char === ';' && braceCount === 0) {
          statements.push(currentStatement.trim());
          currentStatement = '';
        } else if (char === '\n' && braceCount === 0 && currentStatement.trim()) {
          statements.push(currentStatement.trim());
          currentStatement = '';
        }
      }
    }

    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }

    return statements.filter(s => s.length > 0);
  }

  /**
   * 簡單語句解析（回退方法）
   */
  private parseSimpleStatements(code: string): ParsedBlock[] {
    const blocks: ParsedBlock[] = [];
    const lines = code.split('\n').map(line => line.trim()).filter(line => line);

    for (const line of lines) {
      const block = this.parseStatement(line);
      if (block) {
        blocks.push(block);
      }
    }

    return blocks;
  }

  /**
   * 驗證和清理數值 - 確保與 CodeGenerator 一致
   */
  private validateNumber(value: any, defaultValue: string = '0', min: number | null = null, max: number | null = null): string {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }

    const num = parseFloat(value);
    if (isNaN(num)) {
      return defaultValue;
    }

    if (min !== null && num < min) {
      return min.toString();
    }

    if (max !== null && num > max) {
      return max.toString();
    }

    // 對於整數，移除小數點
    if (Number.isInteger(num)) {
      return Math.floor(num).toString();
    }

    return num.toString();
  }

  /**
   * 驗證和清理變數名稱 - 確保與 CodeGenerator 一致
   */
  private validateVariableName(name: any, defaultName: string = 'variable'): string {
    if (!name || typeof name !== 'string') {
      return defaultName;
    }

    // 移除無效字符，只保留字母、數字和底線
    let cleanName = name.replace(/[^a-zA-Z0-9_]/g, '');

    // 確保以字母或底線開始
    if (cleanName && /^[0-9]/.test(cleanName)) {
      cleanName = '_' + cleanName;
    }

    // 如果清理後為空，使用預設名稱
    if (!cleanName) {
      return defaultName;
    }

    // 避免 Arduino 關鍵字
    const arduinoKeywords = ['setup', 'loop', 'void', 'int', 'float', 'char', 'byte', 'boolean', 'true', 'false', 'HIGH', 'LOW'];
    if (arduinoKeywords.includes(cleanName.toLowerCase())) {
      return '_' + cleanName;
    }

    return cleanName;
  }

  /**
   * 生成積木鏈，正確處理 next 關係
   */
  private generateBlockChain(blocks: ParsedBlock[], indent: number): string {
    if (blocks.length === 0) return '';

    const spaces = ' '.repeat(indent);
    const xmlParts: string[] = [];

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const isLast = i === blocks.length - 1;

      xmlParts.push(`${spaces}<block type="${block.type}">`);

      // 添加字段
      for (const [fieldName, fieldValue] of Object.entries(block.fields)) {
        xmlParts.push(`${spaces}  <field name="${fieldName}">${fieldValue}</field>`);
      }

      // 添加輸入
      for (const [inputName, inputValue] of Object.entries(block.inputs)) {
        if (inputValue) {
          if (Array.isArray(inputValue)) {
            // 語句輸入（如 if 的 DO, ELSE）
            if (inputValue.length > 0) {
              xmlParts.push(`${spaces}  <statement name="${inputName}">`);
              xmlParts.push(this.generateBlockChain(inputValue, indent + 4));
              xmlParts.push(`${spaces}  </statement>`);
            }
          } else if (typeof inputValue === 'object' && inputValue.type) {
            // 值輸入（如條件、數值）
            xmlParts.push(`${spaces}  <value name="${inputName}">`);
            xmlParts.push(this.generateSingleBlock(inputValue, indent + 4));
            xmlParts.push(`${spaces}  </value>`);
          }
        }
      }

      // 如果不是最後一個積木，添加 next 標籤並包含下一個積木
      if (!isLast) {
        xmlParts.push(`${spaces}  <next>`);
        xmlParts.push(this.generateBlockChain(blocks.slice(i + 1), indent + 4));
        xmlParts.push(`${spaces}  </next>`);
        xmlParts.push(`${spaces}</block>`);
        break; // 重要：跳出循環，因為剩餘的積木已經在遞歸中處理了
      } else {
        xmlParts.push(`${spaces}</block>`);
      }
    }

    return xmlParts.join('\n');
  }

  /**
   * 生成單個積木的 XML，不包含 next 鏈接
   */
  private generateSingleBlock(block: ParsedBlock, indent: number): string {
    const spaces = ' '.repeat(indent);
    const xmlParts: string[] = [];

    xmlParts.push(`${spaces}<block type="${block.type}">`);

    // 添加字段
    for (const [fieldName, fieldValue] of Object.entries(block.fields)) {
      xmlParts.push(`${spaces}  <field name="${fieldName}">${fieldValue}</field>`);
    }

    // 添加輸入
    for (const [inputName, inputValue] of Object.entries(block.inputs)) {
      if (inputValue) {
        if (Array.isArray(inputValue)) {
          // 語句輸入（如 if 的 DO0, ELSE）
          if (inputValue.length > 0) {
            xmlParts.push(`${spaces}  <statement name="${inputName}">`);
            xmlParts.push(this.generateBlockChain(inputValue, indent + 4));
            xmlParts.push(`${spaces}  </statement>`);
          }
        } else if (typeof inputValue === 'object' && inputValue.type) {
          // 值輸入（如條件、數值） - 遞歸調用
          xmlParts.push(`${spaces}  <value name="${inputName}">`);
          xmlParts.push(this.generateSingleBlock(inputValue, indent + 4));
          xmlParts.push(`${spaces}  </value>`);
        } else if (typeof inputValue === 'string') {
          // 簡單字串值 - 創建文字積木
          xmlParts.push(`${spaces}  <value name="${inputName}">`);
          xmlParts.push(`${spaces}    <block type="text">`);
          xmlParts.push(`${spaces}      <field name="TEXT">${inputValue}</field>`);
          xmlParts.push(`${spaces}    </block>`);
          xmlParts.push(`${spaces}  </value>`);
        }
      }
    }

    xmlParts.push(`${spaces}</block>`);

    return xmlParts.join('\n');
  }

  /**
   * 查找完整的語句（包括大括號內容）
   */
  private findCompleteStatements(code: string, keyword: string): Array<{ index: number; full: string }> {
    const results: Array<{ index: number; full: string }> = [];
    const regex = new RegExp(`\\b${keyword}\\s*\\(`, 'g');
    let match;

    while ((match = regex.exec(code)) !== null) {
      const startIndex = match.index;

      // 找到條件的結束位置
      let parenCount = 0;
      let conditionEnd = -1;

      for (let i = match.index + match[0].length - 1; i < code.length; i++) {
        if (code[i] === '(') parenCount++;
        if (code[i] === ')') parenCount--;
        if (parenCount === 0) {
          conditionEnd = i;
          break;
        }
      }

      if (conditionEnd === -1) continue;

      // 找到語句體的開始
      let bodyStart = -1;
      for (let i = conditionEnd + 1; i < code.length; i++) {
        if (code[i] === '{') {
          bodyStart = i;
          break;
        }
        if (code[i] !== ' ' && code[i] !== '\n' && code[i] !== '\t') {
          break;
        }
      }

      if (bodyStart === -1) continue;

      // 找到匹配的結束大括號
      let braceCount = 1;
      let bodyEnd = -1;

      for (let i = bodyStart + 1; i < code.length; i++) {
        if (code[i] === '{') braceCount++;
        if (code[i] === '}') braceCount--;
        if (braceCount === 0) {
          bodyEnd = i;
          break;
        }
      }

      if (bodyEnd === -1) continue;

      // 檢查是否有 else 子句（僅對 if 語句）
      let elseEnd = bodyEnd;
      if (keyword === 'if') {
        const afterIf = code.substring(bodyEnd + 1).trim();
        if (afterIf.startsWith('else')) {
          const elseMatch = afterIf.match(/^else\s*\{/);
          if (elseMatch) {
            const elseStart = bodyEnd + 1 + afterIf.indexOf('{');
            let elseBraceCount = 1;

            for (let i = elseStart + 1; i < code.length; i++) {
              if (code[i] === '{') elseBraceCount++;
              if (code[i] === '}') elseBraceCount--;
              if (elseBraceCount === 0) {
                elseEnd = i;
                break;
              }
            }
          }
        }
      }

      const fullStatement = code.substring(startIndex, elseEnd + 1);
      results.push({ index: startIndex, full: fullStatement });
    }

    return results;
  }
}