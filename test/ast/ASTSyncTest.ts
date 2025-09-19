/**
 * AST 雙向同步測試系統
 * 測試 程式碼 → AST → Blockly → 程式碼 的完整循環
 */

import { ArduinoParser } from '../../src/ast/ArduinoParser';
import { ASTToBlocks, BlocklyWorkspace } from '../../src/ast/ASTToBlocks';
import { ArduinoCodeGenerator } from '../../src/arduino/CodeGenerator';

export interface TestCase {
  name: string;
  input: string;
  expectedBlocks?: string[];
  expectedSimilarity?: number;
}

export interface TestResult {
  name: string;
  success: boolean;
  similarity: number;
  originalCode: string;
  reconstructedCode: string;
  blocklyWorkspace: BlocklyWorkspace;
  error?: string;
  parseTree?: any;
}

export class ASTSyncTest {
  private parser: ArduinoParser;
  private astToBlocks: ASTToBlocks;
  private codeGenerator: ArduinoCodeGenerator;

  constructor() {
    this.astToBlocks = new ASTToBlocks();
    this.codeGenerator = new ArduinoCodeGenerator();
  }

  /**
   * 執行所有測試
   */
  public runAllTests(): TestResult[] {
    console.log('=== AST 雙向同步測試開始 ===\n');

    const testCases = this.getTestCases();
    const results: TestResult[] = [];

    for (const testCase of testCases) {
      try {
        const result = this.runSingleTest(testCase);
        results.push(result);
      } catch (error) {
        results.push({
          name: testCase.name,
          success: false,
          similarity: 0,
          originalCode: testCase.input,
          reconstructedCode: '',
          blocklyWorkspace: { setupBlocks: [], loopBlocks: [], globalVariables: [] },
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    this.printResults(results);
    return results;
  }

  /**
   * 執行單個測試
   */
  public runSingleTest(testCase: TestCase): TestResult {
    console.log(`\n--- 測試: ${testCase.name} ---`);
    console.log('原始程式碼:');
    console.log(testCase.input);

    // Step 1: 程式碼 → AST
    this.parser = new ArduinoParser(testCase.input);
    const ast = this.parser.parse();

    console.log(`\n解析的AST結構 (${ast.body.length} 個頂層節點):`);
    ast.body.forEach((node, index) => {
      console.log(`${index + 1}. ${node.type}: ${this.getNodeDescription(node)}`);
    });

    // Step 2: AST → Blockly
    const workspace = this.astToBlocks.convertProgram(ast);

    console.log(`\n轉換的Blockly工作區:`);
    console.log(`- Setup blocks: ${workspace.setupBlocks.length}`);
    console.log(`- Loop blocks: ${workspace.loopBlocks.length}`);
    console.log(`- Global variables: ${workspace.globalVariables.length}`);

    // 顯示積木詳細信息
    if (workspace.setupBlocks.length > 0) {
      console.log('\nSetup積木:');
      workspace.setupBlocks.forEach((block, index) => {
        console.log(`  ${index + 1}. ${block.type} - ${JSON.stringify(block.fields || {})}`);
      });
    }

    if (workspace.loopBlocks.length > 0) {
      console.log('\nLoop積木:');
      workspace.loopBlocks.forEach((block, index) => {
        console.log(`  ${index + 1}. ${block.type} - ${JSON.stringify(block.fields || {})}`);
      });
    }

    // Step 3: Blockly → 程式碼 (簡化實現)
    const reconstructedCode = this.generateCodeFromWorkspace(workspace);

    console.log('\n重建程式碼:');
    console.log(reconstructedCode);

    // Step 4: 計算相似度
    const similarity = this.calculateSimilarity(testCase.input, reconstructedCode);
    console.log(`\n相似度: ${similarity.toFixed(2)}%`);

    const success = similarity >= (testCase.expectedSimilarity || 80);
    console.log(`測試結果: ${success ? '✅ 通過' : '❌ 失敗'}`);

    return {
      name: testCase.name,
      success,
      similarity,
      originalCode: testCase.input,
      reconstructedCode,
      blocklyWorkspace: workspace,
      parseTree: this.astToDebugTree(ast)
    };
  }

  /**
   * 獲取測試案例
   */
  private getTestCases(): TestCase[] {
    return [
      // 基礎函數測試
      {
        name: '簡單的setup函數',
        input: `void setup() {
  pinMode(13, OUTPUT);
}`,
        expectedBlocks: ['arduino_pinmode'],
        expectedSimilarity: 85
      },

      {
        name: '簡單的digitalWrite',
        input: `void setup() {
  digitalWrite(13, HIGH);
}`,
        expectedBlocks: ['arduino_digitalwrite'],
        expectedSimilarity: 85
      },

      {
        name: '變數宣告和使用',
        input: `void setup() {
  int ledPin = 13;
  digitalWrite(ledPin, HIGH);
}`,
        expectedBlocks: ['variables_define', 'arduino_digitalwrite'],
        expectedSimilarity: 80
      },

      // 表達式測試
      {
        name: 'analogRead表達式',
        input: `void setup() {
  int value = analogRead(A0);
}`,
        expectedBlocks: ['variables_define', 'arduino_analogread'],
        expectedSimilarity: 80
      },

      {
        name: '數學運算',
        input: `void setup() {
  int result = 100 + 50;
}`,
        expectedBlocks: ['variables_define', 'math_arithmetic'],
        expectedSimilarity: 80
      },

      // 條件語句測試
      {
        name: 'if語句',
        input: `void loop() {
  if (digitalRead(2) == HIGH) {
    digitalWrite(13, HIGH);
  }
}`,
        expectedBlocks: ['controls_if', 'logic_compare', 'arduino_digitalread', 'arduino_digitalwrite'],
        expectedSimilarity: 75
      },

      {
        name: 'if-else語句',
        input: `void loop() {
  if (analogRead(A0) > 512) {
    digitalWrite(13, HIGH);
  } else {
    digitalWrite(13, LOW);
  }
}`,
        expectedBlocks: ['controls_if', 'logic_compare', 'arduino_analogread', 'arduino_digitalwrite'],
        expectedSimilarity: 75
      },

      // 迴圈測試
      {
        name: '簡單for迴圈',
        input: `void setup() {
  for (int i = 0; i < 5; i++) {
    digitalWrite(13, HIGH);
  }
}`,
        expectedBlocks: ['controls_repeat_ext', 'arduino_digitalwrite'],
        expectedSimilarity: 70
      },

      {
        name: 'while迴圈',
        input: `void loop() {
  while (digitalRead(2) == LOW) {
    delay(100);
  }
}`,
        expectedBlocks: ['controls_whileUntil', 'logic_compare', 'arduino_digitalread', 'arduino_delay'],
        expectedSimilarity: 70
      },

      // 複雜程式測試
      {
        name: '閃爍LED完整程式',
        input: `void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}`,
        expectedBlocks: ['arduino_pinmode', 'arduino_digitalwrite', 'arduino_delay'],
        expectedSimilarity: 80
      },

      {
        name: '感測器控制',
        input: `void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  int sensorValue = analogRead(A0);
  if (sensorValue > 512) {
    digitalWrite(13, HIGH);
  } else {
    digitalWrite(13, LOW);
  }
  delay(100);
}`,
        expectedBlocks: ['arduino_pinmode', 'variables_define', 'arduino_analogread',
                        'controls_if', 'logic_compare', 'arduino_digitalwrite', 'arduino_delay'],
        expectedSimilarity: 75
      },

      // 錯誤處理測試
      {
        name: '語法錯誤測試',
        input: `void setup() {
  digitalWrite(13 HIGH);
}`,
        expectedSimilarity: 0
      }
    ];
  }

  /**
   * 從工作區生成程式碼
   */
  private generateCodeFromWorkspace(workspace: BlocklyWorkspace): string {
    let code = '';

    // 全域變數
    if (workspace.globalVariables.length > 0) {
      for (const varBlock of workspace.globalVariables) {
        code += this.blockToCode(varBlock, 0) + '\n';
      }
      code += '\n';
    }

    // setup函數
    code += 'void setup() {\n';
    for (const block of workspace.setupBlocks) {
      code += this.blockToCode(block, 2);
    }
    code += '}\n\n';

    // loop函數
    code += 'void loop() {\n';
    for (const block of workspace.loopBlocks) {
      code += this.blockToCode(block, 2);
    }
    code += '}\n';

    return code;
  }

  /**
   * 積木轉程式碼
   */
  private blockToCode(block: any, indent: number): string {
    const spaces = ' '.repeat(indent);

    switch (block.type) {
      case 'variables_define':
        const varType = block.fields?.TYPE || 'int';
        const varName = block.fields?.VAR || 'var';
        const varValue = this.inputToCode(block.inputs?.VALUE) || '0';
        return `${spaces}${varType} ${varName} = ${varValue};\n`;

      case 'variables_declare':
        const declType = block.fields?.TYPE || 'int';
        const declName = block.fields?.VAR || 'var';
        return `${spaces}${declType} ${declName};\n`;

      case 'variables_set':
        const setVar = block.fields?.VAR || 'var';
        const setValue = this.inputToCode(block.inputs?.VALUE) || '0';
        return `${spaces}${setVar} = ${setValue};\n`;

      case 'arduino_digitalwrite':
        const dwPin = this.inputToCode(block.inputs?.PIN) || '13';
        const dwState = block.fields?.STATE || 'HIGH';
        return `${spaces}digitalWrite(${dwPin}, ${dwState});\n`;

      case 'arduino_pinmode':
        const pmPin = this.inputToCode(block.inputs?.PIN) || '13';
        const pmMode = block.fields?.MODE || 'OUTPUT';
        return `${spaces}pinMode(${pmPin}, ${pmMode});\n`;

      case 'arduino_analogwrite':
        const awPin = this.inputToCode(block.inputs?.PIN) || '9';
        const awValue = this.inputToCode(block.inputs?.VALUE) || '255';
        return `${spaces}analogWrite(${awPin}, ${awValue});\n`;

      case 'arduino_delay':
        const delayTime = block.fields?.TIME || '1000';
        return `${spaces}delay(${delayTime});\n`;

      case 'controls_if':
        const condition = this.inputToCode(block.inputs?.IF0) || 'true';
        let ifCode = `${spaces}if (${condition}) {\n`;

        if (block.inputs?.DO0 && Array.isArray(block.inputs.DO0)) {
          for (const doBlock of block.inputs.DO0) {
            ifCode += this.blockToCode(doBlock, indent + 2);
          }
        }

        ifCode += `${spaces}}`;

        if (block.inputs?.ELSE && Array.isArray(block.inputs.ELSE)) {
          ifCode += ' else {\n';
          for (const elseBlock of block.inputs.ELSE) {
            ifCode += this.blockToCode(elseBlock, indent + 2);
          }
          ifCode += `${spaces}}`;
        }

        return ifCode + '\n';

      case 'controls_repeat_ext':
        const times = this.inputToCode(block.inputs?.TIMES) || '10';
        let forCode = `${spaces}for (int i = 0; i < ${times}; i++) {\n`;

        if (block.inputs?.DO && Array.isArray(block.inputs.DO)) {
          for (const doBlock of block.inputs.DO) {
            forCode += this.blockToCode(doBlock, indent + 2);
          }
        }

        return forCode + `${spaces}}\n`;

      case 'arduino_raw_statement':
        const rawCode = block.fields?.CODE || '';
        return `${spaces}${rawCode};\n`;

      default:
        return `${spaces}// 未知積木: ${block.type}\n`;
    }
  }

  /**
   * 輸入轉程式碼
   */
  private inputToCode(input: any): string {
    if (!input) return '';

    if (typeof input === 'string') return input;
    if (typeof input === 'number') return input.toString();

    if (typeof input === 'object') {
      switch (input.type) {
        case 'math_number':
          return input.fields?.NUM?.toString() || '0';
        case 'text':
          return `"${input.fields?.TEXT || ''}"`;
        case 'variables_get':
          return input.fields?.VAR || 'var';
        case 'arduino_digitalread':
          const drPin = this.inputToCode(input.inputs?.PIN);
          return `digitalRead(${drPin})`;
        case 'arduino_analogread':
          const arPin = this.inputToCode(input.inputs?.PIN);
          return `analogRead(${arPin})`;
        case 'logic_compare':
          const op = input.fields?.OP || 'EQ';
          const opMap: { [key: string]: string } = {
            'EQ': '==', 'NEQ': '!=', 'LT': '<', 'LTE': '<=', 'GT': '>', 'GTE': '>='
          };
          const left = this.inputToCode(input.inputs?.A);
          const right = this.inputToCode(input.inputs?.B);
          return `${left} ${opMap[op] || '=='} ${right}`;
        case 'arduino_raw_expression':
          return input.fields?.CODE || 'expr';
        default:
          return 'expr';
      }
    }

    return '';
  }

  /**
   * 計算相似度
   */
  private calculateSimilarity(original: string, reconstructed: string): number {
    const normalize = (code: string) => {
      return code
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*([{}();,])\s*/g, '$1')
        .trim()
        .toLowerCase();
    };

    const normalizedOriginal = normalize(original);
    const normalizedReconstructed = normalize(reconstructed);

    if (normalizedOriginal === normalizedReconstructed) return 100;

    const distance = this.levenshteinDistance(normalizedOriginal, normalizedReconstructed);
    const maxLength = Math.max(normalizedOriginal.length, normalizedReconstructed.length);

    if (maxLength === 0) return 100;

    return Math.max(0, ((maxLength - distance) / maxLength) * 100);
  }

  /**
   * 編輯距離
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * 節點描述
   */
  private getNodeDescription(node: any): string {
    switch (node.type) {
      case 'FunctionDeclaration':
        return `${node.name.name}()`;
      case 'VariableDeclaration':
        return `${node.dataType} ${node.name.name}`;
      default:
        return node.type;
    }
  }

  /**
   * AST轉除錯樹
   */
  private astToDebugTree(ast: any): any {
    const simplify = (node: any): any => {
      if (!node || typeof node !== 'object') return node;

      const result: any = { type: node.type };

      for (const [key, value] of Object.entries(node)) {
        if (key === 'type') continue;
        if (Array.isArray(value)) {
          result[key] = value.map(simplify);
        } else if (typeof value === 'object' && value !== null) {
          result[key] = simplify(value);
        } else {
          result[key] = value;
        }
      }

      return result;
    };

    return simplify(ast);
  }

  /**
   * 列印結果
   */
  private printResults(results: TestResult[]): void {
    console.log('\n' + '='.repeat(80));
    console.log('AST 雙向同步測試結果摘要');
    console.log('='.repeat(80));

    const passed = results.filter(r => r.success).length;
    const total = results.length;
    const passRate = (passed / total) * 100;

    console.log(`總測試數: ${total}`);
    console.log(`通過數: ${passed}`);
    console.log(`失敗數: ${total - passed}`);
    console.log(`通過率: ${passRate.toFixed(1)}%`);

    const avgSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
    console.log(`平均相似度: ${avgSimilarity.toFixed(1)}%`);

    console.log('\n詳細結果:');
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.name} (${result.similarity.toFixed(1)}%)`);
      if (result.error) {
        console.log(`   錯誤: ${result.error}`);
      }
    });
  }
}