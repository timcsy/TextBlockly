/**
 * Arduino Code Generator - Arduino 程式碼生成器
 */

export interface CodeGenerationResult {
  code: string;
  includes: string[];
  variables: string[];
  functions: string[];
}

export interface CodeValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Arduino 程式碼生成器
 */
export class ArduinoCodeGenerator {
  private includes: Set<string> = new Set();
  private variables: Set<string> = new Set();
  private functions: Set<string> = new Set();

  /**
   * 從 Blockly 工作區生成完整的 Arduino 程式碼
   */
  generateCode(workspace: any): CodeGenerationResult {
    this.reset();

    const setupCode = this.generateSetupCode(workspace);
    const loopCode = this.generateLoopCode(workspace);

    const code = this.assembleProgram(setupCode, loopCode);

    // 驗證生成的程式碼
    const validation = this.validateGeneratedCode(code);
    if (!validation.isValid) {
      console.warn('Generated code validation warnings:', validation.warnings);
    }

    return {
      code,
      includes: Array.from(this.includes),
      variables: Array.from(this.variables),
      functions: Array.from(this.functions),
    };
  }

  /**
   * 重置生成器狀態
   */
  private reset(): void {
    this.includes.clear();
    this.variables.clear();
    this.functions.clear();
  }

  /**
   * 生成 setup 函數程式碼
   */
  private generateSetupCode(workspace: any): string {
    // 查找 setup 積木
    const setupBlocks = workspace.getBlocksByType('arduino_setup');
    if (setupBlocks.length === 0) {
      return '  // 請添加 setup 積木';
    }

    const setupBlock = setupBlocks[0];
    const innerCode = this.generateBlockCode(
      setupBlock.getInputTargetBlock('SETUP_CODE')
    );

    return innerCode || '  // 初始化程式碼';
  }

  /**
   * 生成 loop 函數程式碼
   */
  private generateLoopCode(workspace: any): string {
    // 查找 loop 積木
    const loopBlocks = workspace.getBlocksByType('arduino_loop');
    if (loopBlocks.length === 0) {
      return '  // 請添加 loop 積木';
    }

    const loopBlock = loopBlocks[0];
    const innerCode = this.generateBlockCode(
      loopBlock.getInputTargetBlock('LOOP_CODE')
    );

    return innerCode || '  // 主要程式邏輯';
  }

  /**
   * 生成積木程式碼
   */
  private generateBlockCode(block: any, indent: string = '  '): string {
    if (!block) {
      return '';
    }

    let code = '';
    let currentBlock = block;

    while (currentBlock) {
      const blockCode = this.generateSingleBlockCode(currentBlock, indent);
      if (blockCode) {
        code += blockCode + '\n';
      }
      currentBlock = currentBlock.getNextBlock();
    }

    return code.trim();
  }

  /**
   * 生成單一積木的程式碼
   */
  private generateSingleBlockCode(block: any, indent: string): string {
    const blockType = block.type;

    switch (blockType) {
      case 'arduino_digitalwrite':
        return this.generateDigitalWrite(block, indent);
      case 'arduino_digitalread':
        return this.generateDigitalRead(block, indent);
      case 'arduino_pinmode':
        return this.generatePinMode(block, indent);
      case 'arduino_analogread':
        return this.generateAnalogRead(block, indent);
      case 'arduino_analogwrite':
        return this.generateAnalogWrite(block, indent);
      case 'arduino_delay':
        return this.generateDelay(block, indent);
      case 'arduino_delayMicroseconds':
        return this.generateDelayMicroseconds(block, indent);
      default:
        return this.generateDefaultBlock(block, indent);
    }
  }

  /**
   * 生成 digitalWrite 程式碼
   */
  private generateDigitalWrite(block: any, indent: string): string {
    const pin = this.validateNumber(block.getFieldValue('PIN'), '13', 0, 53);
    const state = block.getFieldValue('STATE') || 'HIGH';
    return `${indent}digitalWrite(${pin}, ${state});`;
  }

  /**
   * 生成 digitalRead 程式碼
   */
  private generateDigitalRead(block: any, _indent: string): string {
    const pin = this.validateNumber(block.getFieldValue('PIN'), '2', 0, 53);
    return `digitalRead(${pin})`;
  }

  /**
   * 生成 pinMode 程式碼
   */
  private generatePinMode(block: any, indent: string): string {
    const pin = this.validateNumber(block.getFieldValue('PIN'), '13', 0, 53);
    const mode = block.getFieldValue('MODE') || 'OUTPUT';
    return `${indent}pinMode(${pin}, ${mode});`;
  }

  /**
   * 生成 analogRead 程式碼
   */
  private generateAnalogRead(block: any, _indent: string): string {
    const pin = block.getFieldValue('PIN') || 'A0';
    // 驗證類比腳位格式
    const validPin = /^A[0-5]$/.test(pin) ? pin : 'A0';
    return `analogRead(${validPin})`;
  }

  /**
   * 生成 analogWrite 程式碼
   */
  private generateAnalogWrite(block: any, indent: string): string {
    const pin = this.validateNumber(block.getFieldValue('PIN'), '9', 0, 53);
    const value = this.validateNumber(block.getFieldValue('VALUE'), '128', 0, 255);
    return `${indent}analogWrite(${pin}, ${value});`;
  }

  /**
   * 生成 delay 程式碼
   */
  private generateDelay(block: any, indent: string): string {
    const time = this.validateNumber(block.getFieldValue('TIME'), '1000', 0);
    return `${indent}delay(${time});`;
  }

  /**
   * 生成 delayMicroseconds 程式碼
   */
  private generateDelayMicroseconds(block: any, indent: string): string {
    const time = this.validateNumber(block.getFieldValue('TIME'), '1000', 0, 16383);
    return `${indent}delayMicroseconds(${time});`;
  }

  /**
   * 生成預設積木程式碼（處理標準 Blockly 積木）
   */
  private generateDefaultBlock(block: any, indent: string): string {
    const blockType = block.type;

    switch (blockType) {
      // 控制流程積木
      case 'controls_if':
        return this.generateControlsIf(block, indent);
      case 'controls_repeat_ext':
        return this.generateControlsRepeat(block, indent);
      case 'controls_whileUntil':
        return this.generateControlsWhile(block, indent);
      case 'controls_for':
        return this.generateControlsFor(block, indent);

      // 邏輯積木
      case 'logic_compare':
        return this.generateLogicCompare(block);
      case 'logic_operation':
        return this.generateLogicOperation(block);
      case 'logic_negate':
        return this.generateLogicNegate(block);
      case 'logic_boolean':
        return this.generateLogicBoolean(block);

      // 數學積木
      case 'math_number':
        return this.generateMathNumber(block);
      case 'math_arithmetic':
        return this.generateMathArithmetic(block);
      case 'math_single':
        return this.generateMathSingle(block);
      case 'math_trig':
        return this.generateMathTrig(block);
      case 'math_constant':
        return this.generateMathConstant(block);

      // 變數積木
      case 'variables_get':
        return this.generateVariablesGet(block);
      case 'variables_set':
        return this.generateVariablesSet(block, indent);
      case 'variables_declare':
        return this.generateVariablesDeclare(block, indent);
      case 'variables_define':
        return this.generateVariablesDefine(block, indent);

      // Serial 通訊積木
      case 'arduino_serial_begin':
        return this.generateSerialBegin(block, indent);
      case 'arduino_serial_print':
        return this.generateSerialPrint(block, indent);
      case 'arduino_serial_available':
        return 'Serial.available()';
      case 'arduino_serial_read':
        return 'Serial.read()';
      case 'arduino_serial_read_string':
        return 'Serial.readString()';

      // Arduino 數學函數積木
      case 'arduino_map':
        return this.generateMap(block);
      case 'arduino_constrain':
        return this.generateConstrain(block);
      case 'arduino_min':
        return this.generateMin(block);
      case 'arduino_max':
        return this.generateMax(block);
      case 'arduino_abs':
        return this.generateAbs(block);
      case 'arduino_pow':
        return this.generatePow(block);
      case 'arduino_sqrt':
        return this.generateSqrt(block);

      // Arduino 時間函數積木
      case 'arduino_millis':
        return 'millis()';
      case 'arduino_micros':
        return 'micros()';

      // Arduino 隨機數積木
      case 'arduino_random':
        return this.generateRandom(block);
      case 'arduino_random_seed':
        return this.generateRandomSeed(block, indent);

      // 文字處理積木
      case 'text_string':
        return this.generateTextString(block);
      case 'text_join':
        return this.generateTextJoin(block);
      case 'text_length':
        return this.generateTextLength(block);
      case 'text_isEmpty':
        return this.generateTextIsEmpty(block);
      case 'text_indexOf':
        return this.generateTextIndexOf(block);
      case 'text_charAt':
        return this.generateTextCharAt(block);
      case 'text_substring':
        return this.generateTextSubstring(block);
      case 'text_changeCase':
        return this.generateTextChangeCase(block);
      case 'text_trim':
        return this.generateTextTrim(block);
      case 'text_replace':
        return this.generateTextReplace(block);
      case 'text_number_conversion':
        return this.generateTextNumberConversion(block);

      default:
        console.warn(`Unknown block type: ${blockType}`);
        return `${indent}// TODO: ${blockType} 積木`;
    }
  }

  // 控制流程積木生成方法
  private generateControlsIf(block: any, indent: string): string {
    const condition = this.generateValueCode(block.getInputTargetBlock('IF0')) || 'true';
    const doCode = this.generateBlockCode(block.getInputTargetBlock('DO0'), indent + '  ');
    const elseCode = this.generateBlockCode(block.getInputTargetBlock('ELSE'), indent + '  ');

    let code = `${indent}if (${condition}) {\n${doCode}\n${indent}}`;
    if (elseCode) {
      code += ` else {\n${elseCode}\n${indent}}`;
    }
    return code;
  }

  private generateControlsRepeat(block: any, indent: string): string {
    const times = this.validateNumber(this.generateValueCode(block.getInputTargetBlock('TIMES')), '10', 0);
    const doCode = this.generateBlockCode(block.getInputTargetBlock('DO'), indent + '  ');

    return `${indent}for (int i = 0; i < ${times}; i++) {\n${doCode}\n${indent}}`;
  }

  private generateControlsWhile(block: any, indent: string): string {
    const mode = block.getFieldValue('MODE');
    const condition = this.generateValueCode(block.getInputTargetBlock('BOOL')) || 'true';
    const doCode = this.generateBlockCode(block.getInputTargetBlock('DO'), indent + '  ');

    const whileCondition = mode === 'WHILE' ? condition : `!(${condition})`;
    return `${indent}while (${whileCondition}) {\n${doCode}\n${indent}}`;
  }

  private generateControlsFor(block: any, indent: string): string {
    const variable = this.validateVariableName(block.getFieldValue('VAR'), 'i');
    const from = this.validateNumber(this.generateValueCode(block.getInputTargetBlock('FROM')), '1');
    const to = this.validateNumber(this.generateValueCode(block.getInputTargetBlock('TO')), '10');
    const by = this.validateNumber(this.generateValueCode(block.getInputTargetBlock('BY')), '1');
    const doCode = this.generateBlockCode(block.getInputTargetBlock('DO'), indent + '  ');

    return `${indent}for (int ${variable} = ${from}; ${variable} <= ${to}; ${variable} += ${by}) {\n${doCode}\n${indent}}`;
  }

  // 邏輯積木生成方法
  private generateLogicCompare(block: any): string {
    const operator = block.getFieldValue('OP');
    const a = this.generateValueCode(block.getInputTargetBlock('A')) || '0';
    const b = this.generateValueCode(block.getInputTargetBlock('B')) || '0';

    const operators: { [key: string]: string } = {
      'EQ': '==',
      'NEQ': '!=',
      'LT': '<',
      'LTE': '<=',
      'GT': '>',
      'GTE': '>='
    };

    return `${a} ${operators[operator] || '=='} ${b}`;
  }

  private generateLogicOperation(block: any): string {
    const operator = block.getFieldValue('OP');
    const a = this.generateValueCode(block.getInputTargetBlock('A')) || 'false';
    const b = this.generateValueCode(block.getInputTargetBlock('B')) || 'false';

    const operators: { [key: string]: string } = {
      'AND': '&&',
      'OR': '||'
    };

    return `${a} ${operators[operator] || '&&'} ${b}`;
  }

  private generateLogicNegate(block: any): string {
    const bool = this.generateValueCode(block.getInputTargetBlock('BOOL')) || 'false';
    return `!(${bool})`;
  }

  private generateLogicBoolean(block: any): string {
    return block.getFieldValue('BOOL') === 'TRUE' ? 'true' : 'false';
  }

  // 數學積木生成方法
  private generateMathNumber(block: any): string {
    return this.validateNumber(block.getFieldValue('NUM'), '0');
  }

  private generateMathArithmetic(block: any): string {
    const operator = block.getFieldValue('OP');
    const a = this.generateValueCode(block.getInputTargetBlock('A')) || '0';
    const b = this.generateValueCode(block.getInputTargetBlock('B')) || '0';

    const operators: { [key: string]: string } = {
      'ADD': '+',
      'MINUS': '-',
      'MULTIPLY': '*',
      'DIVIDE': '/',
      'POWER': 'pow'
    };

    if (operator === 'POWER') {
      this.addInclude('<math.h>');
      return `pow(${a}, ${b})`;
    }

    return `${a} ${operators[operator] || '+'} ${b}`;
  }

  private generateMathSingle(block: any): string {
    const operator = block.getFieldValue('OP');
    const num = this.generateValueCode(block.getInputTargetBlock('NUM')) || '0';

    this.addInclude('<math.h>');

    const operators: { [key: string]: string } = {
      'ROOT': `sqrt(${num})`,
      'ABS': `abs(${num})`,
      'NEG': `-(${num})`,
      'LN': `log(${num})`,
      'LOG10': `log10(${num})`,
      'EXP': `exp(${num})`,
      'POW10': `pow(10, ${num})`
    };

    return operators[operator] || `/* ${operator} */(${num})`;
  }

  private generateMathTrig(block: any): string {
    const operator = block.getFieldValue('OP');
    const num = this.generateValueCode(block.getInputTargetBlock('NUM')) || '0';

    this.addInclude('<math.h>');

    const operators: { [key: string]: string } = {
      'SIN': `sin(${num})`,
      'COS': `cos(${num})`,
      'TAN': `tan(${num})`,
      'ASIN': `asin(${num})`,
      'ACOS': `acos(${num})`,
      'ATAN': `atan(${num})`
    };

    return operators[operator] || `/* ${operator} */(${num})`;
  }

  private generateMathConstant(block: any): string {
    const constant = block.getFieldValue('CONSTANT');

    const constants: { [key: string]: string } = {
      'PI': 'PI',
      'E': 'E',
      'GOLDEN_RATIO': '1.61803398875',
      'SQRT2': 'sqrt(2)',
      'SQRT1_2': 'sqrt(0.5)',
      'INFINITY': 'INFINITY'
    };

    if (constant === 'SQRT2' || constant === 'SQRT1_2') {
      this.addInclude('<math.h>');
    }

    return constants[constant] || '1';
  }

  // 變數積木生成方法
  private generateVariablesGet(block: any): string {
    const variable = block.getFieldValue('VAR') || 'variable';
    return this.validateVariableName(variable, 'variable');
  }

  private generateVariablesSet(block: any, indent: string): string {
    const variable = this.validateVariableName(block.getFieldValue('VAR'), 'variable');
    const value = this.generateValueCode(block.getInputTargetBlock('VALUE')) || '0';

    // 添加變數宣告（如果還沒有）
    this.addVariable(`int ${variable};`);

    return `${indent}${variable} = ${value};`;
  }

  // 輔助方法：生成值表達式的程式碼
  private generateValueCode(block: any): string {
    if (!block) {
      return '';
    }

    return this.generateSingleBlockCode(block, '').trim();
  }

  /**
   * 組裝完整程式
   */
  private assembleProgram(setupCode: string, loopCode: string): string {
    const header = this.generateHeader();
    const includesCode = this.generateIncludes();
    const variablesCode = this.generateVariables();
    const functionsCode = this.generateFunctions();

    return `${header}

${includesCode}

${variablesCode}

${functionsCode}

void setup() {
${setupCode}
}

void loop() {
${loopCode}
}`.replace(/\n\s*\n\s*\n/g, '\n\n'); // 移除多餘的空行
  }

  /**
   * 生成程式標頭
   */
  private generateHeader(): string {
    const now = new Date();
    return `// Arduino 程式碼
// 由 TextBlockly 自動生成
// 生成時間: ${now.toLocaleString()}`;
  }

  /**
   * 生成 include 語句
   */
  private generateIncludes(): string {
    if (this.includes.size === 0) {
      return '';
    }

    return Array.from(this.includes)
      .map((include) => `#include ${include}`)
      .join('\n');
  }

  /**
   * 生成變數宣告
   */
  private generateVariables(): string {
    if (this.variables.size === 0) {
      return '';
    }

    return Array.from(this.variables).join('\n');
  }

  /**
   * 生成函數定義
   */
  private generateFunctions(): string {
    if (this.functions.size === 0) {
      return '';
    }

    return Array.from(this.functions).join('\n\n');
  }

  /**
   * 添加 include
   */
  addInclude(include: string): void {
    this.includes.add(include);
  }

  /**
   * 添加變數
   */
  addVariable(variable: string): void {
    this.variables.add(variable);
  }

  /**
   * 添加函數
   */
  addFunction(func: string): void {
    this.functions.add(func);
  }

  /**
   * 驗證和清理數值
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
   * 驗證和清理變數名稱
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
   * 驗證生成的 Arduino 程式碼
   */
  private validateGeneratedCode(code: string): CodeValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // 檢查基本結構
      this.validateBasicStructure(code, warnings, errors);

      // 檢查語法正確性
      this.validateSyntax(code, warnings, errors);

      // 檢查 Arduino 特定規則
      this.validateArduinoRules(code, warnings, errors);

      // 檢查變數和函數使用
      this.validateUsage(code, warnings, errors);

    } catch (error) {
      errors.push(`驗證過程發生錯誤: ${(error as Error).message}`);
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }

  /**
   * 驗證基本程式結構
   */
  private validateBasicStructure(code: string, warnings: string[], errors: string[]): void {
    // 檢查是否有 setup 函數
    if (!code.includes('void setup()')) {
      errors.push('缺少 setup() 函數');
    }

    // 檢查是否有 loop 函數
    if (!code.includes('void loop()')) {
      errors.push('缺少 loop() 函數');
    }

    // 檢查大括號平衡
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push(`大括號不平衡: ${openBraces} 個 { vs ${closeBraces} 個 }`);
    }

    // 檢查小括號平衡
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push(`小括號不平衡: ${openParens} 個 ( vs ${closeParens} 個 )`);
    }
  }

  /**
   * 驗證語法正確性
   */
  private validateSyntax(code: string, warnings: string[], errors: string[]): void {
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNum = i + 1;

      if (line === '') continue;

      // 檢查語句結尾的分號
      if (this.shouldHaveSemicolon(line) && !line.endsWith(';')) {
        warnings.push(`第 ${lineNum} 行可能缺少分號: ${line}`);
      }

      // 檢查函數調用語法
      this.validateFunctionCalls(line, lineNum, warnings, errors);

      // 檢查變數賦值語法
      this.validateAssignments(line, lineNum, warnings, errors);
    }
  }

  /**
   * 驗證 Arduino 特定規則
   */
  private validateArduinoRules(code: string, warnings: string[], errors: string[]): void {
    // 檢查腳位範圍
    const pinPatterns = [
      /digitalWrite\s*\(\s*(\d+)/g,
      /digitalRead\s*\(\s*(\d+)/g,
      /pinMode\s*\(\s*(\d+)/g,
      /analogWrite\s*\(\s*(\d+)/g
    ];

    for (const pattern of pinPatterns) {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        const pin = parseInt(match[1]);
        if (pin < 0 || pin > 53) {
          warnings.push(`腳位 ${pin} 超出有效範圍 (0-53)`);
        }
      }
    }

    // 檢查類比腳位
    const analogPattern = /analogRead\s*\(\s*(A?\d+)/g;
    let analogMatch;
    while ((analogMatch = analogPattern.exec(code)) !== null) {
      const pin = analogMatch[1];
      if (!/^A[0-5]$/.test(pin) && !/^[0-5]$/.test(pin)) {
        warnings.push(`類比腳位 ${pin} 格式不正確，應為 A0-A5`);
      }
    }

    // 檢查 PWM 值範圍
    const pwmPattern = /analogWrite\s*\(\s*\d+\s*,\s*(\d+)/g;
    let pwmMatch;
    while ((pwmMatch = pwmPattern.exec(code)) !== null) {
      const value = parseInt(pwmMatch[1]);
      if (value < 0 || value > 255) {
        warnings.push(`PWM 值 ${value} 超出有效範圍 (0-255)`);
      }
    }

    // 檢查延遲時間
    const delayPattern = /delay\s*\(\s*(\d+)/g;
    let delayMatch;
    while ((delayMatch = delayPattern.exec(code)) !== null) {
      const delay = parseInt(delayMatch[1]);
      if (delay > 60000) {
        warnings.push(`延遲時間 ${delay}ms 可能過長，考慮使用較短的時間`);
      }
    }
  }

  /**
   * 驗證變數和函數使用
   */
  private validateUsage(code: string, warnings: string[], errors: string[]): void {
    // 檢查未宣告的變數使用
    const variableUsage = code.match(/[a-zA-Z_]\w*\s*=/g);
    if (variableUsage) {
      for (const usage of variableUsage) {
        const varName = usage.replace(/\s*=$/, '');
        if (!code.includes(`int ${varName}`) && !code.includes(`float ${varName}`) &&
            !code.includes(`char ${varName}`) && !code.includes(`boolean ${varName}`)) {
          warnings.push(`變數 ${varName} 可能未宣告`);
        }
      }
    }

    // 檢查重複的變數宣告
    const declarations = code.match(/int\s+([a-zA-Z_]\w*)/g);
    if (declarations) {
      const varNames = declarations.map(d => d.replace(/int\s+/, ''));
      const uniqueVars = new Set(varNames);
      if (varNames.length !== uniqueVars.size) {
        warnings.push('檢測到可能的重複變數宣告');
      }
    }
  }

  /**
   * 檢查語句是否應該有分號
   */
  private shouldHaveSemicolon(line: string): boolean {
    // 排除註解、大括號、預處理指令等不需要分號的行
    if (line.startsWith('//') || line.startsWith('/*') || line.startsWith('#') ||
        line === '{' || line === '}' || line.includes('void ') ||
        line.includes('if ') || line.includes('for ') || line.includes('while ') ||
        line.includes('else')) {
      return false;
    }

    // 包含函數調用或賦值的語句通常需要分號
    return line.includes('(') || line.includes('=') || line.includes('digitalWrite') ||
           line.includes('digitalRead') || line.includes('pinMode') ||
           line.includes('analogWrite') || line.includes('analogRead') ||
           line.includes('delay');
  }

  /**
   * 驗證函數調用語法
   */
  private validateFunctionCalls(line: string, lineNum: number, warnings: string[], errors: string[]): void {
    const functionPattern = /(\w+)\s*\(/g;
    let match;

    while ((match = functionPattern.exec(line)) !== null) {
      const funcName = match[1];

      // 檢查 Arduino 函數的參數數量
      if (funcName === 'digitalWrite' && !line.match(/digitalWrite\s*\(\s*\d+\s*,\s*(HIGH|LOW|\d+)\s*\)/)) {
        warnings.push(`第 ${lineNum} 行: digitalWrite 參數格式不正確`);
      }

      if (funcName === 'pinMode' && !line.match(/pinMode\s*\(\s*\d+\s*,\s*(INPUT|OUTPUT|INPUT_PULLUP)\s*\)/)) {
        warnings.push(`第 ${lineNum} 行: pinMode 參數格式不正確`);
      }
    }
  }

  /**
   * 驗證賦值語法
   */
  private validateAssignments(line: string, lineNum: number, warnings: string[], errors: string[]): void {
    const assignmentPattern = /([a-zA-Z_]\w*)\s*=\s*(.+)/;
    const match = line.match(assignmentPattern);

    if (match) {
      const varName = match[1];
      const value = match[2].replace(/;$/, '');

      // 檢查變數名稱有效性
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(varName)) {
        errors.push(`第 ${lineNum} 行: 變數名稱 "${varName}" 不符合命名規則`);
      }

      // 檢查是否賦值給 Arduino 關鍵字
      const keywords = ['setup', 'loop', 'void', 'int', 'float', 'HIGH', 'LOW'];
      if (keywords.includes(varName)) {
        errors.push(`第 ${lineNum} 行: 不能對關鍵字 "${varName}" 賦值`);
      }
    }
  }

  /**
   * 生成簡單的 Arduino 程式範例
   */
  static generateExample(): string {
    return `// Arduino 程式碼範例
// 由 TextBlockly 生成

void setup() {
  // 設定 LED 腳位為輸出
  pinMode(13, OUTPUT);
}

void loop() {
  // 點亮 LED
  digitalWrite(13, HIGH);
  delay(1000);

  // 熄滅 LED
  digitalWrite(13, LOW);
  delay(1000);
}`;
  }

  // 新增的Arduino積木生成方法

  // 變數積木
  private generateVariablesDeclare(block: any, indent: string): string {
    const type = block.getFieldValue('TYPE') || 'int';
    const name = this.validateVariableName(block.getFieldValue('VAR'), 'myVar');
    return `${indent}${type} ${name};`;
  }

  private generateVariablesDefine(block: any, indent: string): string {
    const type = block.getFieldValue('TYPE') || 'int';
    const name = this.validateVariableName(block.getFieldValue('VAR'), 'myVar');
    const value = this.generateValueCode(block.getInputTargetBlock('VALUE')) || '0';
    return `${indent}${type} ${name} = ${value};`;
  }

  // Serial 通訊積木
  private generateSerialBegin(block: any, indent: string): string {
    const baud = this.generateValueCode(block.getInputTargetBlock('BAUD')) || '9600';
    return `${indent}Serial.begin(${baud});`;
  }

  private generateSerialPrint(block: any, indent: string): string {
    const mode = block.getFieldValue('MODE') || 'PRINT';
    const text = this.generateValueCode(block.getInputTargetBlock('TEXT')) || '""';
    const methodName = mode === 'PRINTLN' ? 'println' : 'print';
    return `${indent}Serial.${methodName}(${text});`;
  }

  // Arduino 數學函數積木
  private generateMap(block: any): string {
    const value = this.generateValueCode(block.getInputTargetBlock('VALUE')) || '0';
    const fromLow = this.generateValueCode(block.getInputTargetBlock('FROM_LOW')) || '0';
    const fromHigh = this.generateValueCode(block.getInputTargetBlock('FROM_HIGH')) || '1023';
    const toLow = this.generateValueCode(block.getInputTargetBlock('TO_LOW')) || '0';
    const toHigh = this.generateValueCode(block.getInputTargetBlock('TO_HIGH')) || '255';
    return `map(${value}, ${fromLow}, ${fromHigh}, ${toLow}, ${toHigh})`;
  }

  private generateConstrain(block: any): string {
    const value = this.generateValueCode(block.getInputTargetBlock('VALUE')) || '0';
    const min = this.generateValueCode(block.getInputTargetBlock('MIN')) || '0';
    const max = this.generateValueCode(block.getInputTargetBlock('MAX')) || '255';
    return `constrain(${value}, ${min}, ${max})`;
  }

  private generateMin(block: any): string {
    const a = this.generateValueCode(block.getInputTargetBlock('A')) || '0';
    const b = this.generateValueCode(block.getInputTargetBlock('B')) || '0';
    return `min(${a}, ${b})`;
  }

  private generateMax(block: any): string {
    const a = this.generateValueCode(block.getInputTargetBlock('A')) || '0';
    const b = this.generateValueCode(block.getInputTargetBlock('B')) || '0';
    return `max(${a}, ${b})`;
  }

  private generateAbs(block: any): string {
    const value = this.generateValueCode(block.getInputTargetBlock('VALUE')) || '0';
    return `abs(${value})`;
  }

  private generatePow(block: any): string {
    const base = this.generateValueCode(block.getInputTargetBlock('BASE')) || '2';
    const exp = this.generateValueCode(block.getInputTargetBlock('EXPONENT')) || '2';
    return `pow(${base}, ${exp})`;
  }

  private generateSqrt(block: any): string {
    const value = this.generateValueCode(block.getInputTargetBlock('VALUE')) || '4';
    return `sqrt(${value})`;
  }

  // Arduino 隨機數積木
  private generateRandom(block: any): string {
    const min = this.generateValueCode(block.getInputTargetBlock('MIN')) || '0';
    const max = this.generateValueCode(block.getInputTargetBlock('MAX')) || '100';
    return `random(${min}, ${max})`;
  }

  private generateRandomSeed(block: any, indent: string): string {
    const seed = this.generateValueCode(block.getInputTargetBlock('SEED')) || 'analogRead(0)';
    return `${indent}randomSeed(${seed});`;
  }

  // 文字處理積木
  private generateTextString(block: any): string {
    const value = block.getFieldValue('TEXT') || '';
    return `"${value}"`;
  }

  private generateTextJoin(block: any): string {
    const a = this.generateValueCode(block.getInputTargetBlock('A')) || '""';
    const b = this.generateValueCode(block.getInputTargetBlock('B')) || '""';
    return `(String(${a}) + String(${b}))`;
  }

  private generateTextLength(block: any): string {
    const value = this.generateValueCode(block.getInputTargetBlock('VALUE')) || '""';
    return `String(${value}).length()`;
  }

  private generateTextIsEmpty(block: any): string {
    const value = this.generateValueCode(block.getInputTargetBlock('VALUE')) || '""';
    return `(String(${value}).length() == 0)`;
  }

  private generateTextIndexOf(block: any): string {
    const value = this.generateValueCode(block.getInputTargetBlock('VALUE')) || '""';
    const find = this.generateValueCode(block.getInputTargetBlock('FIND')) || '""';
    return `String(${value}).indexOf(String(${find}))`;
  }

  private generateTextCharAt(block: any): string {
    const value = this.generateValueCode(block.getInputTargetBlock('VALUE')) || '""';
    const at = this.generateValueCode(block.getInputTargetBlock('AT')) || '0';
    return `String(${value}).charAt(${at})`;
  }

  private generateTextSubstring(block: any): string {
    const string = this.generateValueCode(block.getInputTargetBlock('STRING')) || '""';
    const from = this.generateValueCode(block.getInputTargetBlock('FROM')) || '0';
    const to = this.generateValueCode(block.getInputTargetBlock('TO')) || '1';
    return `String(${string}).substring(${from}, ${to})`;
  }

  private generateTextChangeCase(block: any): string {
    const text = this.generateValueCode(block.getInputTargetBlock('TEXT')) || '""';
    const caseMode = block.getFieldValue('CASE') || 'UPPERCASE';
    const method = caseMode === 'UPPERCASE' ? 'toUpperCase' : 'toLowerCase';
    return `String(${text}).${method}()`;
  }

  private generateTextTrim(block: any): string {
    const text = this.generateValueCode(block.getInputTargetBlock('TEXT')) || '""';
    return `String(${text}).trim()`;
  }

  private generateTextReplace(block: any): string {
    const text = this.generateValueCode(block.getInputTargetBlock('TEXT')) || '""';
    const from = this.generateValueCode(block.getInputTargetBlock('FROM')) || '""';
    const to = this.generateValueCode(block.getInputTargetBlock('TO')) || '""';
    return `String(${text}).replace(String(${from}), String(${to}))`;
  }

  private generateTextNumberConversion(block: any): string {
    const value = this.generateValueCode(block.getInputTargetBlock('VALUE')) || '0';
    const type = block.getFieldValue('TYPE') || 'STRING';
    if (type === 'STRING') {
      return `String(${value})`;
    } else {
      return `String(${value}).toInt()`;
    }
  }
}
