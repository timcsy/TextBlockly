/**
 * Arduino Code Generator - Arduino 程式碼生成器
 */

export interface CodeGenerationResult {
  code: string;
  includes: string[];
  variables: string[];
  functions: string[];
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
    const pin = block.getFieldValue('PIN');
    const state = block.getFieldValue('STATE');
    return `${indent}digitalWrite(${pin}, ${state});`;
  }

  /**
   * 生成 digitalRead 程式碼
   */
  private generateDigitalRead(block: any, _indent: string): string {
    const pin = block.getFieldValue('PIN');
    return `digitalRead(${pin})`;
  }

  /**
   * 生成 pinMode 程式碼
   */
  private generatePinMode(block: any, indent: string): string {
    const pin = block.getFieldValue('PIN');
    const mode = block.getFieldValue('MODE');
    return `${indent}pinMode(${pin}, ${mode});`;
  }

  /**
   * 生成 analogRead 程式碼
   */
  private generateAnalogRead(block: any, _indent: string): string {
    const pin = block.getFieldValue('PIN');
    return `analogRead(${pin})`;
  }

  /**
   * 生成 analogWrite 程式碼
   */
  private generateAnalogWrite(block: any, indent: string): string {
    const pin = block.getFieldValue('PIN');
    const value = block.getFieldValue('VALUE');
    return `${indent}analogWrite(${pin}, ${value});`;
  }

  /**
   * 生成 delay 程式碼
   */
  private generateDelay(block: any, indent: string): string {
    const time = block.getFieldValue('TIME');
    return `${indent}delay(${time});`;
  }

  /**
   * 生成 delayMicroseconds 程式碼
   */
  private generateDelayMicroseconds(block: any, indent: string): string {
    const time = block.getFieldValue('TIME');
    return `${indent}delayMicroseconds(${time});`;
  }

  /**
   * 生成預設積木程式碼（處理標準 Blockly 積木）
   */
  private generateDefaultBlock(block: any, indent: string): string {
    // 這裡處理標準的 Blockly 積木（如 if, for, while 等）
    // 暫時返回註解，後續實作
    return `${indent}// ${block.type} 積木`;
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
}
