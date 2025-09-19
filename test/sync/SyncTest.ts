import { ArduinoCodeParser } from '../../src/arduino/CodeParser';
import { ArduinoCodeGenerator } from '../../src/arduino/CodeGenerator';

/**
 * 雙向同步測試系統 - 類似AutoEncoder的測試方式
 * 測試 程式碼 → 積木 → 程式碼 的完整循環
 */
export class SyncTest {
  private parser: ArduinoCodeParser;
  private generator: ArduinoCodeGenerator;

  constructor() {
    this.parser = new ArduinoCodeParser();
    this.generator = new ArduinoCodeGenerator();
  }

  /**
   * 執行雙向同步測試
   */
  public runAllTests(): TestResult[] {
    console.log('=== 雙向同步測試開始 ===\n');

    const results: TestResult[] = [];

    // 基礎積木測試
    results.push(...this.testBasicBlocks());

    // 表達式測試
    results.push(...this.testExpressions());

    // 複合語句測試
    results.push(...this.testComplexStatements());

    // 結構化語句測試
    results.push(...this.testStructuredStatements());

    // 完整程式測試
    results.push(...this.testCompletePrograms());

    this.printResults(results);
    return results;
  }

  /**
   * 基礎積木測試
   */
  private testBasicBlocks(): TestResult[] {
    const testCases = [
      // 數位IO
      {
        name: 'digitalWrite - 固定值',
        code: `void setup() {
  digitalWrite(13, HIGH);
}`
      },
      {
        name: 'digitalWrite - 變數腳位',
        code: `void setup() {
  digitalWrite(ledPin, HIGH);
}`
      },
      {
        name: 'digitalRead',
        code: `void setup() {
  int value = digitalRead(2);
}`
      },
      {
        name: 'pinMode',
        code: `void setup() {
  pinMode(13, OUTPUT);
}`
      },

      // 類比IO
      {
        name: 'analogRead',
        code: `void setup() {
  int sensorValue = analogRead(A0);
}`
      },
      {
        name: 'analogWrite',
        code: `void setup() {
  analogWrite(9, 255);
}`
      },

      // 延遲
      {
        name: 'delay',
        code: `void setup() {
  delay(1000);
}`
      },
      {
        name: 'delayMicroseconds',
        code: `void setup() {
  delayMicroseconds(500);
}`
      },

      // 變數
      {
        name: 'variables_declare',
        code: `void setup() {
  int myVar;
}`
      },
      {
        name: 'variables_define',
        code: `void setup() {
  int myVar = 42;
}`
      },
      {
        name: 'variables_set',
        code: `void setup() {
  myVar = 100;
}`
      }
    ];

    return testCases.map(testCase => this.runSingleTest(testCase.name, testCase.code));
  }

  /**
   * 表達式測試
   */
  private testExpressions(): TestResult[] {
    const testCases = [
      {
        name: '數學運算 - 加法',
        code: `void setup() {
  int result = a + b;
}`
      },
      {
        name: '數學運算 - 複合',
        code: `void setup() {
  int result = (a + b) * c;
}`
      },
      {
        name: '比較運算',
        code: `void setup() {
  bool result = temperature > 25;
}`
      },
      {
        name: '邏輯運算',
        code: `void setup() {
  bool result = (a > 0) && (b < 100);
}`
      },
      {
        name: 'analogRead表達式',
        code: `void setup() {
  int brightness = analogRead(A0) / 4;
}`
      },
      {
        name: 'digitalRead條件',
        code: `void setup() {
  bool pressed = digitalRead(buttonPin) == LOW;
}`
      }
    ];

    return testCases.map(testCase => this.runSingleTest(testCase.name, testCase.code));
  }

  /**
   * 複合語句測試
   */
  private testComplexStatements(): TestResult[] {
    const testCases = [
      {
        name: 'Serial通訊',
        code: `void setup() {
  Serial.begin(9600);
  Serial.println("Hello World");
}`
      },
      {
        name: '複合IO操作',
        code: `void setup() {
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, digitalRead(buttonPin));
}`
      },
      {
        name: '數學計算與IO',
        code: `void setup() {
  int sensorValue = analogRead(A0);
  int brightness = map(sensorValue, 0, 1023, 0, 255);
  analogWrite(ledPin, brightness);
}`
      }
    ];

    return testCases.map(testCase => this.runSingleTest(testCase.name, testCase.code));
  }

  /**
   * 結構化語句測試
   */
  private testStructuredStatements(): TestResult[] {
    const testCases = [
      {
        name: 'if語句 - 簡單',
        code: `void loop() {
  if (digitalRead(2) == HIGH) {
    digitalWrite(13, HIGH);
  }
}`
      },
      {
        name: 'if-else語句',
        code: `void loop() {
  if (analogRead(A0) > 512) {
    digitalWrite(13, HIGH);
  } else {
    digitalWrite(13, LOW);
  }
}`
      },
      {
        name: 'for迴圈 - 簡單重複',
        code: `void setup() {
  for (int i = 0; i < 5; i++) {
    digitalWrite(13, HIGH);
    delay(500);
  }
}`
      },
      {
        name: 'while迴圈',
        code: `void loop() {
  while (digitalRead(buttonPin) == LOW) {
    delay(10);
  }
}`
      }
    ];

    return testCases.map(testCase => this.runSingleTest(testCase.name, testCase.code));
  }

  /**
   * 完整程式測試
   */
  private testCompletePrograms(): TestResult[] {
    const testCases = [
      {
        name: '閃爍LED完整程式',
        code: `void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}`
      },
      {
        name: '按鈕控制LED',
        code: `int buttonPin = 2;
int ledPin = 13;

void setup() {
  pinMode(buttonPin, INPUT);
  pinMode(ledPin, OUTPUT);
}

void loop() {
  if (digitalRead(buttonPin) == HIGH) {
    digitalWrite(ledPin, HIGH);
  } else {
    digitalWrite(ledPin, LOW);
  }
}`
      },
      {
        name: '感測器控制PWM',
        code: `void setup() {
  Serial.begin(9600);
}

void loop() {
  int sensorValue = analogRead(A0);
  int pwmValue = map(sensorValue, 0, 1023, 0, 255);
  analogWrite(9, pwmValue);
  Serial.println(sensorValue);
  delay(100);
}`
      }
    ];

    return testCases.map(testCase => this.runSingleTest(testCase.name, testCase.code));
  }

  /**
   * 執行單個測試
   */
  private runSingleTest(name: string, originalCode: string): TestResult {
    console.log(`\n--- 測試: ${name} ---`);

    try {
      // 第一步：程式碼 → 積木
      console.log('原始程式碼:');
      console.log(originalCode);

      const parsedWorkspace = this.parser.parseCode(originalCode);
      console.log('\n解析結果:');
      console.log('Setup blocks:', parsedWorkspace.setupBlocks.length);
      console.log('Loop blocks:', parsedWorkspace.loopBlocks.length);

      // 第二步：積木 → XML
      const blocklyXML = this.parser.blocksToXml(parsedWorkspace);
      console.log('\n生成的XML (前200字符):');
      console.log(blocklyXML.substring(0, 200) + '...');

      // 第三步：XML → 程式碼 (模擬積木轉程式碼)
      // 這裡我們直接使用parsed blocks來生成程式碼
      const reconstructedCode = this.generateCodeFromBlocks(parsedWorkspace);
      console.log('\n重建程式碼:');
      console.log(reconstructedCode);

      // 比較結果
      const similarity = this.calculateSimilarity(originalCode, reconstructedCode);
      console.log(`\n相似度: ${similarity.toFixed(2)}%`);

      const success = similarity > 80; // 80%以上認為成功
      console.log(`測試結果: ${success ? '✅ 通過' : '❌ 失敗'}`);

      return {
        name,
        success,
        similarity,
        originalCode,
        reconstructedCode,
        error: null
      };

    } catch (error) {
      console.log(`❌ 錯誤: ${error}`);
      return {
        name,
        success: false,
        similarity: 0,
        originalCode,
        reconstructedCode: '',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 從積木結構生成程式碼
   */
  private generateCodeFromBlocks(workspace: any): string {
    let code = '';

    // 添加全域變數 (如果有的話)

    // 生成setup函數
    code += 'void setup() {\n';
    if (workspace.setupBlocks && workspace.setupBlocks.length > 0) {
      for (const block of workspace.setupBlocks) {
        const blockCode = this.generateCodeFromBlock(block, 2);
        if (blockCode.trim()) {
          code += blockCode;
        }
      }
    }
    code += '}\n\n';

    // 生成loop函數
    code += 'void loop() {\n';
    if (workspace.loopBlocks && workspace.loopBlocks.length > 0) {
      for (const block of workspace.loopBlocks) {
        const blockCode = this.generateCodeFromBlock(block, 2);
        if (blockCode.trim()) {
          code += blockCode;
        }
      }
    }
    code += '}\n';

    return code;
  }

  /**
   * 從單個積木生成程式碼
   */
  private generateCodeFromBlock(block: any, indent: number = 0): string {
    const spaces = ' '.repeat(indent);

    switch (block.type) {
      case 'arduino_digitalwrite':
        const pin = this.getFieldOrInput(block, 'PIN');
        const state = this.getFieldOrInput(block, 'STATE');
        return `${spaces}digitalWrite(${pin}, ${state});\n`;

      case 'arduino_digitalread':
        const readPin = this.getFieldOrInput(block, 'PIN');
        return `digitalRead(${readPin})`;

      case 'arduino_pinmode':
        const pmPin = this.getFieldOrInput(block, 'PIN');
        const mode = this.getFieldOrInput(block, 'MODE');
        return `${spaces}pinMode(${pmPin}, ${mode});\n`;

      case 'arduino_analogwrite':
        const awPin = this.getFieldOrInput(block, 'PIN');
        const awValue = this.getFieldOrInput(block, 'VALUE');
        return `${spaces}analogWrite(${awPin}, ${awValue});\n`;

      case 'arduino_analogread':
        const arPin = this.getFieldOrInput(block, 'PIN');
        return `analogRead(${arPin})`;

      case 'arduino_delay':
        const delayTime = this.getFieldOrInput(block, 'TIME');
        return `${spaces}delay(${delayTime});\n`;

      case 'variables_define':
        const type = this.getFieldOrInput(block, 'TYPE');
        const varName = this.getFieldOrInput(block, 'VAR');
        const value = this.getFieldOrInput(block, 'VALUE');
        return `${spaces}${type} ${varName} = ${value};\n`;

      case 'variables_set':
        const setVar = this.getFieldOrInput(block, 'VAR');
        const setValue = this.getFieldOrInput(block, 'VALUE');
        return `${spaces}${setVar} = ${setValue};\n`;

      case 'arduino_raw_statement':
        const code = this.getFieldOrInput(block, 'CODE');
        return `${spaces}${code};\n`;

      case 'arduino_raw_expression':
        const expr = this.getFieldOrInput(block, 'CODE');
        return expr;

      case 'math_number':
        const num = this.getFieldOrInput(block, 'NUM');
        return num.toString();

      case 'variables_get':
        const getVar = this.getFieldOrInput(block, 'VAR');
        return getVar;

      default:
        console.log(`未知積木類型: ${block.type}`);
        return `${spaces}// 未知積木: ${block.type}\n`;
    }
  }

  /**
   * 獲取積木的欄位或輸入值
   */
  private getFieldOrInput(block: any, name: string): string {
    // 先檢查fields
    if (block.fields && block.fields[name] !== undefined) {
      return block.fields[name];
    }

    // 再檢查inputs
    if (block.inputs && block.inputs[name]) {
      const input = block.inputs[name];
      if (typeof input === 'object' && input.type) {
        return this.generateCodeFromBlock(input, 0);
      } else if (typeof input === 'string') {
        return input;
      }
    }

    return '0'; // 預設值
  }

  /**
   * 計算兩段程式碼的相似度
   */
  private calculateSimilarity(original: string, reconstructed: string): number {
    // 正規化程式碼 (移除註解、多餘空白等)
    const normalize = (code: string) => {
      return code
        .replace(/\/\/.*$/gm, '') // 移除註解
        .replace(/\/\*[\s\S]*?\*\//g, '') // 移除區塊註解
        .replace(/\s+/g, ' ') // 標準化空白
        .replace(/\s*([{}();,])\s*/g, '$1') // 標準化標點符號
        .trim()
        .toLowerCase();
    };

    const normalizedOriginal = normalize(original);
    const normalizedReconstructed = normalize(reconstructed);

    // 使用編輯距離計算相似度
    const distance = this.levenshteinDistance(normalizedOriginal, normalizedReconstructed);
    const maxLength = Math.max(normalizedOriginal.length, normalizedReconstructed.length);

    if (maxLength === 0) return 100;

    const similarity = ((maxLength - distance) / maxLength) * 100;
    return Math.max(0, similarity);
  }

  /**
   * 計算編輯距離
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
   * 列印測試結果摘要
   */
  private printResults(results: TestResult[]): void {
    console.log('\n' + '='.repeat(50));
    console.log('雙向同步測試結果摘要');
    console.log('='.repeat(50));

    const passed = results.filter(r => r.success).length;
    const total = results.length;
    const passRate = (passed / total) * 100;

    console.log(`總測試數: ${total}`);
    console.log(`通過數: ${passed}`);
    console.log(`失敗數: ${total - passed}`);
    console.log(`通過率: ${passRate.toFixed(1)}%`);

    const avgSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
    console.log(`平均相似度: ${avgSimilarity.toFixed(1)}%`);

    console.log('\n失敗的測試:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`❌ ${result.name} (相似度: ${result.similarity.toFixed(1)}%)`);
      if (result.error) {
        console.log(`   錯誤: ${result.error}`);
      }
    });

    console.log('\n通過率較低的測試:');
    results
      .filter(r => r.success && r.similarity < 90)
      .forEach(result => {
        console.log(`⚠️ ${result.name} (相似度: ${result.similarity.toFixed(1)}%)`);
      });
  }
}

interface TestResult {
  name: string;
  success: boolean;
  similarity: number;
  originalCode: string;
  reconstructedCode: string;
  error: string | null;
}

// 導出用於測試
export { TestResult };