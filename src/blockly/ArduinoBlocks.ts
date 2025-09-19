/**
 * Arduino Blocks - Arduino 專用積木定義
 */

export interface BlockDefinition {
  type: string;
  message0: string;
  args0?: any[];
  previousStatement?: string | null;
  nextStatement?: string | null;
  output?: string | null;
  colour: number;
  tooltip: string;
  helpUrl: string;
  inputsInline?: boolean;
}

/**
 * Arduino 積木定義
 */
export class ArduinoBlocks {
  /**
   * 獲取所有 Arduino 積木定義
   */
  static getAllBlocks(): BlockDefinition[] {
    return [
      ...this.getDigitalIOBlocks(),
      ...this.getAnalogIOBlocks(),
      ...this.getSerialBlocks(),
      ...this.getTextBlocks(),
      ...this.getMathBlocks(),
      ...this.getTimeBlocks(),
      ...this.getRandomBlocks(),
      ...this.getControlFlowBlocks(),
      ...this.getStructureBlocks(),
      ...this.getVariableBlocks(),
    ];
  }

  /**
   * 數位 I/O 積木
   */
  static getDigitalIOBlocks(): BlockDefinition[] {
    return [
      {
        type: 'arduino_digitalwrite',
        message0: 'digitalWrite 腳位 %1 輸出 %2',
        args0: [
          {
            type: 'input_value',
            name: 'PIN',
            check: null,
          },
          {
            type: 'field_dropdown',
            name: 'STATE',
            options: [
              ['HIGH', 'HIGH'],
              ['LOW', 'LOW'],
            ],
          },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: 230,
        tooltip: '設定數位腳位的輸出狀態，支援變數輸入',
        helpUrl:
          'https://www.arduino.cc/reference/en/language/functions/digital-io/digitalwrite/',
      },
      {
        type: 'arduino_digitalread',
        message0: 'digitalRead 腳位 %1',
        args0: [
          {
            type: 'input_value',
            name: 'PIN',
            check: null,
          },
        ],
        output: 'Boolean',
        colour: 230,
        tooltip: '讀取數位腳位的狀態，支援變數輸入',
        helpUrl:
          'https://www.arduino.cc/reference/en/language/functions/digital-io/digitalread/',
      },
      {
        type: 'arduino_pinmode',
        message0: 'pinMode 腳位 %1 模式 %2',
        args0: [
          {
            type: 'input_value',
            name: 'PIN',
            check: null,
          },
          {
            type: 'field_dropdown',
            name: 'MODE',
            options: [
              ['OUTPUT', 'OUTPUT'],
              ['INPUT', 'INPUT'],
              ['INPUT_PULLUP', 'INPUT_PULLUP'],
            ],
          },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: 230,
        tooltip: '設定腳位的輸入/輸出模式，支援變數輸入',
        helpUrl:
          'https://www.arduino.cc/reference/en/language/functions/digital-io/pinmode/',
      },
    ];
  }

  /**
   * 類比 I/O 積木
   */
  static getAnalogIOBlocks(): BlockDefinition[] {
    return [
      {
        type: 'arduino_analogread',
        message0: 'analogRead 腳位 %1',
        args0: [
          {
            type: 'input_value',
            name: 'PIN',
            check: null,
          },
        ],
        output: 'Number',
        colour: 160,
        tooltip: '讀取類比腳位的值 (0-1023)',
        helpUrl:
          'https://www.arduino.cc/reference/en/language/functions/analog-io/analogread/',
      },
      {
        type: 'arduino_analogwrite',
        message0: 'analogWrite 腳位 %1 數值 %2',
        args0: [
          {
            type: 'input_value',
            name: 'PIN',
            check: null,
            shadow: {
              type: 'math_number',
              fields: {
                NUM: 9
              }
            }
          },
          {
            type: 'input_value',
            name: 'VALUE',
            check: 'Number',
          },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: 160,
        tooltip: '輸出 PWM 訊號到指定腳位 (0-255)，支援變數輸入',
        helpUrl:
          'https://www.arduino.cc/reference/en/language/functions/analog-io/analogwrite/',
      },
      {
        type: 'arduino_pin',
        message0: '%1',
        args0: [
          {
            type: 'field_input',
            name: 'PIN',
            text: '',
          },
        ],
        output: 'String',
        colour: 160,
        tooltip: 'Arduino 腳位（數位或類比）',
        helpUrl: '',
      },
      {
        type: 'arduino_raw_statement',
        message0: '%1',
        args0: [
          {
            type: 'field_input',
            name: 'CODE',
            text: '',
            spellcheck: false,
          },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: 30,
        tooltip: '萬用敘述積木：直接輸入任何 Arduino 敘述程式碼',
        helpUrl: '',
      },
      {
        type: 'arduino_raw_expression',
        message0: '%1',
        args0: [
          {
            type: 'field_input',
            name: 'CODE',
            text: '表達式',
            spellcheck: false,
          },
        ],
        output: null,
        colour: 30,
        tooltip: '萬用表達式積木：直接輸入任何 Arduino 表達式程式碼',
        helpUrl: '',
      },
      {
        type: 'arduino_raw_block',
        message0: '%1 %2 %3',
        args0: [
          {
            type: 'field_input',
            name: 'CODE',
            text: '區塊',
            spellcheck: false,
          },
          {
            type: 'input_dummy',
          },
          {
            type: 'input_statement',
            name: 'STATEMENTS',
          },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: 30,
        tooltip: '萬用區塊積木：直接輸入控制結構（如 if、for 等）',
        helpUrl: '',
      },
      {
        type: 'arduino_raw_statement_with_expression',
        message0: '%1 %2',
        args0: [
          {
            type: 'field_input',
            name: 'CODE',
            text: '敘述',
            spellcheck: false,
          },
          {
            type: 'input_value',
            name: 'EXPRESSION',
            check: null,
          },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: 30,
        tooltip: '敘述後面可接表達式',
        helpUrl: '',
      },
      {
        type: 'arduino_raw_expression_with_expression',
        message0: '%1 %2',
        args0: [
          {
            type: 'field_input',
            name: 'CODE',
            text: '表達式',
            spellcheck: false,
          },
          {
            type: 'input_value',
            name: 'EXPRESSION',
            check: null,
          },
        ],
        output: null,
        colour: 30,
        tooltip: '表達式後面可接表達式',
        helpUrl: '',
      },
      {
        type: 'arduino_raw_block_with_expression',
        message0: '%1 %2 %3 %4',
        args0: [
          {
            type: 'field_input',
            name: 'CODE',
            text: '區塊',
            spellcheck: false,
          },
          {
            type: 'input_value',
            name: 'EXPRESSION',
            check: null,
          },
          {
            type: 'input_dummy',
          },
          {
            type: 'input_statement',
            name: 'STATEMENTS',
          },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: 30,
        tooltip: '區塊後面可接表達式',
        helpUrl: '',
      },
    ];
  }

  /**
   * Serial 通訊積木
   */
  static getSerialBlocks(): BlockDefinition[] {
    return [
      {
        type: 'arduino_serial_begin',
        message0: 'Serial.begin 鮑率 %1',
        args0: [
          {
            type: 'input_value',
            name: 'BAUD',
            check: 'Number',
            shadow: {
              type: 'math_number',
              fields: {
                NUM: 9600
              }
            }
          },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: 120,
        tooltip: '初始化Serial通訊，設定鮑率',
        helpUrl: 'https://www.arduino.cc/reference/en/language/functions/communication/serial/begin/',
      },
      {
        type: 'arduino_serial_print',
        message0: 'Serial.%1 %2',
        args0: [
          {
            type: 'field_dropdown',
            name: 'MODE',
            options: [
              ['print', 'PRINT'],
              ['println', 'PRINTLN'],
            ],
          },
          {
            type: 'input_value',
            name: 'TEXT',
            check: null,
          },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: 120,
        tooltip: '通過Serial發送文字或數據',
        helpUrl: 'https://www.arduino.cc/reference/en/language/functions/communication/serial/print/',
      },
      {
        type: 'arduino_serial_available',
        message0: 'Serial.available',
        args0: [],
        output: 'Number',
        colour: 120,
        tooltip: '檢查Serial緩衝區是否有可讀取的資料',
        helpUrl: 'https://www.arduino.cc/reference/en/language/functions/communication/serial/available/',
      },
      {
        type: 'arduino_serial_read',
        message0: 'Serial.read',
        args0: [],
        output: 'Number',
        colour: 120,
        tooltip: '從Serial緩衝區讀取一個位元組',
        helpUrl: 'https://www.arduino.cc/reference/en/language/functions/communication/serial/read/',
      },
      {
        type: 'arduino_serial_read_string',
        message0: 'Serial.readString',
        args0: [],
        output: 'String',
        colour: 120,
        tooltip: '從Serial緩衝區讀取整個字串',
        helpUrl: 'https://www.arduino.cc/reference/en/language/functions/communication/serial/readstring/',
      },
    ];
  }

  /**
   * 文字處理積木
   */
  static getTextBlocks(): BlockDefinition[] {
    return [
      {
        type: 'text_string',
        message0: '"%1"',
        args0: [
          {
            type: 'field_input',
            name: 'TEXT',
            text: 'Hello',
          },
        ],
        output: 'String',
        colour: 160,
        tooltip: '文字字串',
        helpUrl: '',
      },
      {
        type: 'text_join',
        message0: '連接 %1 %2',
        args0: [
          {
            type: 'input_value',
            name: 'A',
            check: 'String',
          },
          {
            type: 'input_value',
            name: 'B',
            check: 'String',
          },
        ],
        inputsInline: true,
        output: 'String',
        colour: 160,
        tooltip: '連接兩個文字字串',
        helpUrl: '',
      },
      {
        type: 'text_length',
        message0: '%1 的長度',
        args0: [
          {
            type: 'input_value',
            name: 'VALUE',
            check: 'String',
          },
        ],
        output: 'Number',
        colour: 160,
        tooltip: '取得文字字串的長度',
        helpUrl: '',
      },
      {
        type: 'text_isEmpty',
        message0: '%1 是空的',
        args0: [
          {
            type: 'input_value',
            name: 'VALUE',
            check: 'String',
          },
        ],
        output: 'Boolean',
        colour: 160,
        tooltip: '檢查文字字串是否為空',
        helpUrl: '',
      },
      {
        type: 'text_indexOf',
        message0: '在 %1 中找到 %2 的位置',
        args0: [
          {
            type: 'input_value',
            name: 'VALUE',
            check: 'String',
          },
          {
            type: 'input_value',
            name: 'FIND',
            check: 'String',
          },
        ],
        inputsInline: true,
        output: 'Number',
        colour: 160,
        tooltip: '找到子字串在文字中的位置',
        helpUrl: '',
      },
      {
        type: 'text_charAt',
        message0: '在 %1 的第 %2 個字元',
        args0: [
          {
            type: 'input_value',
            name: 'VALUE',
            check: 'String',
          },
          {
            type: 'input_value',
            name: 'AT',
            check: 'Number',
          },
        ],
        inputsInline: true,
        output: 'String',
        colour: 160,
        tooltip: '取得文字中指定位置的字元',
        helpUrl: '',
      },
      {
        type: 'text_substring',
        message0: '從 %1 擷取 第 %2 到 %3 個字元',
        args0: [
          {
            type: 'input_value',
            name: 'STRING',
            check: 'String',
          },
          {
            type: 'input_value',
            name: 'FROM',
            check: 'Number',
          },
          {
            type: 'input_value',
            name: 'TO',
            check: 'Number',
          },
        ],
        inputsInline: true,
        output: 'String',
        colour: 160,
        tooltip: '擷取文字的子字串',
        helpUrl: '',
      },
      {
        type: 'text_changeCase',
        message0: '將 %1 轉為 %2',
        args0: [
          {
            type: 'input_value',
            name: 'TEXT',
            check: 'String',
          },
          {
            type: 'field_dropdown',
            name: 'CASE',
            options: [
              ['大寫', 'UPPERCASE'],
              ['小寫', 'LOWERCASE'],
            ],
          },
        ],
        inputsInline: true,
        output: 'String',
        colour: 160,
        tooltip: '轉換文字大小寫',
        helpUrl: '',
      },
      {
        type: 'text_trim',
        message0: '移除 %1 的 %2',
        args0: [
          {
            type: 'input_value',
            name: 'TEXT',
            check: 'String',
          },
          {
            type: 'field_dropdown',
            name: 'MODE',
            options: [
              ['兩端空白', 'BOTH'],
              ['左端空白', 'LEFT'],
              ['右端空白', 'RIGHT'],
            ],
          },
        ],
        inputsInline: true,
        output: 'String',
        colour: 160,
        tooltip: '移除文字兩端的空白字元',
        helpUrl: '',
      },
      {
        type: 'text_replace',
        message0: '在 %1 中將 %2 替換為 %3',
        args0: [
          {
            type: 'input_value',
            name: 'TEXT',
            check: 'String',
          },
          {
            type: 'input_value',
            name: 'FROM',
            check: 'String',
          },
          {
            type: 'input_value',
            name: 'TO',
            check: 'String',
          },
        ],
        inputsInline: true,
        output: 'String',
        colour: 160,
        tooltip: '替換文字中的指定內容',
        helpUrl: '',
      },
      {
        type: 'text_number_conversion',
        message0: '將 %1 轉為 %2',
        args0: [
          {
            type: 'input_value',
            name: 'VALUE',
            check: null,
          },
          {
            type: 'field_dropdown',
            name: 'TYPE',
            options: [
              ['文字', 'STRING'],
              ['數字', 'NUMBER'],
            ],
          },
        ],
        inputsInline: true,
        output: null,
        colour: 160,
        tooltip: '在文字和數字之間轉換',
        helpUrl: '',
      },
    ];
  }

  /**
   * Arduino 數學函數積木
   */
  static getMathBlocks(): BlockDefinition[] {
    return [
      {
        type: 'arduino_map',
        message0: 'map %1 從 %2 ~ %3 對應到 %4 ~ %5',
        args0: [
          {
            type: 'input_value',
            name: 'VALUE',
            check: 'Number',
          },
          {
            type: 'input_value',
            name: 'FROM_LOW',
            check: 'Number',
          },
          {
            type: 'input_value',
            name: 'FROM_HIGH',
            check: 'Number',
          },
          {
            type: 'input_value',
            name: 'TO_LOW',
            check: 'Number',
          },
          {
            type: 'input_value',
            name: 'TO_HIGH',
            check: 'Number',
          },
        ],
        inputsInline: true,
        output: 'Number',
        colour: 230,
        tooltip: '將數值從一個範圍映射到另一個範圍',
        helpUrl: 'https://www.arduino.cc/reference/en/language/functions/math/map/',
      },
      {
        type: 'arduino_constrain',
        message0: 'constrain %1 在 %2 到 %3 之間',
        args0: [
          {
            type: 'input_value',
            name: 'VALUE',
            check: 'Number',
          },
          {
            type: 'input_value',
            name: 'MIN',
            check: 'Number',
          },
          {
            type: 'input_value',
            name: 'MAX',
            check: 'Number',
          },
        ],
        inputsInline: true,
        output: 'Number',
        colour: 230,
        tooltip: '限制數值在指定範圍內',
        helpUrl: 'https://www.arduino.cc/reference/en/language/functions/math/constrain/',
      },
      {
        type: 'arduino_min',
        message0: 'min %1 %2',
        args0: [
          {
            type: 'input_value',
            name: 'A',
            check: 'Number',
          },
          {
            type: 'input_value',
            name: 'B',
            check: 'Number',
          },
        ],
        inputsInline: true,
        output: 'Number',
        colour: 230,
        tooltip: '取得兩個數值中的較小值',
        helpUrl: 'https://www.arduino.cc/reference/en/language/functions/math/min/',
      },
      {
        type: 'arduino_max',
        message0: 'max %1 %2',
        args0: [
          {
            type: 'input_value',
            name: 'A',
            check: 'Number',
          },
          {
            type: 'input_value',
            name: 'B',
            check: 'Number',
          },
        ],
        inputsInline: true,
        output: 'Number',
        colour: 230,
        tooltip: '取得兩個數值中的較大值',
        helpUrl: 'https://www.arduino.cc/reference/en/language/functions/math/max/',
      },
      {
        type: 'arduino_abs',
        message0: 'abs %1',
        args0: [
          {
            type: 'input_value',
            name: 'VALUE',
            check: 'Number',
          },
        ],
        output: 'Number',
        colour: 230,
        tooltip: '取得數值的絕對值',
        helpUrl: 'https://www.arduino.cc/reference/en/language/functions/math/abs/',
      },
      {
        type: 'arduino_pow',
        message0: 'pow %1 ^ %2',
        args0: [
          {
            type: 'input_value',
            name: 'BASE',
            check: 'Number',
          },
          {
            type: 'input_value',
            name: 'EXPONENT',
            check: 'Number',
          },
        ],
        inputsInline: true,
        output: 'Number',
        colour: 230,
        tooltip: '計算冪次方',
        helpUrl: 'https://www.arduino.cc/reference/en/language/functions/math/pow/',
      },
      {
        type: 'arduino_sqrt',
        message0: 'sqrt %1',
        args0: [
          {
            type: 'input_value',
            name: 'VALUE',
            check: 'Number',
          },
        ],
        output: 'Number',
        colour: 230,
        tooltip: '計算平方根',
        helpUrl: 'https://www.arduino.cc/reference/en/language/functions/math/sqrt/',
      },
    ];
  }

  /**
   * Arduino 時間函數積木
   */
  static getTimeBlocks(): BlockDefinition[] {
    return [
      {
        type: 'arduino_millis',
        message0: 'millis',
        args0: [],
        output: 'Number',
        colour: 120,
        tooltip: '取得從程式開始執行到現在的毫秒數',
        helpUrl: 'https://www.arduino.cc/reference/en/language/functions/time/millis/',
      },
      {
        type: 'arduino_micros',
        message0: 'micros',
        args0: [],
        output: 'Number',
        colour: 120,
        tooltip: '取得從程式開始執行到現在的微秒數',
        helpUrl: 'https://www.arduino.cc/reference/en/language/functions/time/micros/',
      },
    ];
  }

  /**
   * Arduino 隨機數積木
   */
  static getRandomBlocks(): BlockDefinition[] {
    return [
      {
        type: 'arduino_random',
        message0: 'random %1 到 %2',
        args0: [
          {
            type: 'input_value',
            name: 'MIN',
            check: 'Number',
            shadow: {
              type: 'math_number',
              fields: { NUM: 0 }
            }
          },
          {
            type: 'input_value',
            name: 'MAX',
            check: 'Number',
            shadow: {
              type: 'math_number',
              fields: { NUM: 100 }
            }
          },
        ],
        inputsInline: true,
        output: 'Number',
        colour: 300,
        tooltip: '產生指定範圍內的隨機整數',
        helpUrl: 'https://www.arduino.cc/reference/en/language/functions/random-numbers/random/',
      },
      {
        type: 'arduino_random_seed',
        message0: 'randomSeed %1',
        args0: [
          {
            type: 'input_value',
            name: 'SEED',
            check: 'Number',
          },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: 300,
        tooltip: '設定隨機數種子',
        helpUrl: 'https://www.arduino.cc/reference/en/language/functions/random-numbers/randomseed/',
      },
    ];
  }

  /**
   * 控制流程積木
   */
  static getControlFlowBlocks(): BlockDefinition[] {
    return [
      {
        type: 'arduino_delay',
        message0: 'delay 延遲 %1 毫秒',
        args0: [
          {
            type: 'field_number',
            name: 'TIME',
            value: 1000,
            min: 0,
            precision: 1,
          },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: 120,
        tooltip: '暫停程式執行指定的毫秒數',
        helpUrl:
          'https://www.arduino.cc/reference/en/language/functions/time/delay/',
      },
      {
        type: 'arduino_delayMicroseconds',
        message0: 'delayMicroseconds 延遲 %1 微秒',
        args0: [
          {
            type: 'field_number',
            name: 'TIME',
            value: 1000,
            min: 0,
            precision: 1,
          },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: 120,
        tooltip: '暫停程式執行指定的微秒數',
        helpUrl:
          'https://www.arduino.cc/reference/en/language/functions/time/delaymicroseconds/',
      },
    ];
  }

  /**
   * 程式結構積木
   */
  static getStructureBlocks(): BlockDefinition[] {
    return [
      {
        type: 'arduino_setup',
        message0: 'setup 初始化 %1 %2',
        args0: [
          {
            type: 'input_dummy',
          },
          {
            type: 'input_statement',
            name: 'SETUP_CODE',
          },
        ],
        colour: 290,
        tooltip: 'Arduino 初始化函數，程式開始時執行一次',
        helpUrl:
          'https://www.arduino.cc/reference/en/language/structure/sketch/setup/',
      },
      {
        type: 'arduino_loop',
        message0: 'loop 主迴圈 %1 %2',
        args0: [
          {
            type: 'input_dummy',
          },
          {
            type: 'input_statement',
            name: 'LOOP_CODE',
          },
        ],
        colour: 290,
        tooltip: 'Arduino 主迴圈函數，會持續重複執行',
        helpUrl:
          'https://www.arduino.cc/reference/en/language/structure/sketch/loop/',
      },
    ];
  }

  /**
   * 變數積木
   */
  static getVariableBlocks(): BlockDefinition[] {
    return [
      {
        type: 'variables_get',
        message0: '%1',
        args0: [
          {
            type: 'field_variable',
            name: 'VAR',
            variable: 'item',
          },
        ],
        output: null,
        colour: 330,
        tooltip: '取得變數的值',
        helpUrl: '',
      },
      {
        type: 'variables_set',
        message0: '設定 %1 為 %2',
        args0: [
          {
            type: 'field_variable',
            name: 'VAR',
            variable: 'item',
          },
          {
            type: 'input_value',
            name: 'VALUE',
          },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: 330,
        tooltip: '設定變數的值',
        helpUrl: '',
      },
      {
        type: 'variables_declare',
        message0: '宣告 %1 變數 %2',
        args0: [
          {
            type: 'field_dropdown',
            name: 'TYPE',
            options: [
              ['int', 'int'],
              ['float', 'float'],
              ['boolean', 'boolean'],
              ['char', 'char'],
              ['String', 'String'],
            ],
          },
          {
            type: 'field_variable',
            name: 'VAR',
            variable: 'myVar',
          },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: 330,
        tooltip: '宣告指定類型的變數',
        helpUrl: '',
      },
      {
        type: 'variables_define',
        message0: '定義 %1 變數 %2 = %3',
        args0: [
          {
            type: 'field_dropdown',
            name: 'TYPE',
            options: [
              ['int', 'int'],
              ['float', 'float'],
              ['boolean', 'boolean'],
              ['char', 'char'],
              ['String', 'String'],
            ],
          },
          {
            type: 'field_variable',
            name: 'VAR',
            variable: 'myVar',
          },
          {
            type: 'input_value',
            name: 'VALUE',
          },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: 310,
        tooltip: '定義指定類型的變數',
        helpUrl: '',
      },
    ];
  }

  /**
   * 積木分類定義
   */
  static getToolboxCategories() {
    return {
      kind: 'categoryToolbox',
      contents: [
        {
          kind: 'category',
          name: '數位 I/O',
          colour: '230',
          contents: [
            {
              kind: 'block',
              type: 'arduino_digitalwrite',
              inputs: {
                PIN: {
                  shadow: {
                    type: 'arduino_raw_expression',
                    fields: {
                      CODE: '13'
                    }
                  }
                }
              }
            },
            {
              kind: 'block',
              type: 'arduino_digitalread',
              inputs: {
                PIN: {
                  shadow: {
                    type: 'arduino_raw_expression',
                    fields: {
                      CODE: '13'
                    }
                  }
                }
              }
            },
            {
              kind: 'block',
              type: 'arduino_pinmode',
              inputs: {
                PIN: {
                  shadow: {
                    type: 'arduino_raw_expression',
                    fields: {
                      CODE: '13'
                    }
                  }
                }
              }
            },
          ],
        },
        {
          kind: 'category',
          name: '類比 I/O',
          colour: '160',
          contents: [
            {
              kind: 'block',
              type: 'arduino_analogread',
              inputs: {
                PIN: {
                  shadow: {
                    type: 'arduino_raw_expression',
                    fields: {
                      CODE: 'A0'
                    }
                  }
                }
              }
            },
            {
              kind: 'block',
              type: 'arduino_analogwrite',
              inputs: {
                PIN: {
                  shadow: {
                    type: 'arduino_raw_expression',
                    fields: {
                      CODE: '9'
                    }
                  }
                },
                VALUE: {
                  shadow: {
                    type: 'arduino_raw_expression',
                    fields: {
                      CODE: '255'
                    }
                  }
                }
              }
            },
          ],
        },
        {
          kind: 'category',
          name: '控制',
          colour: '120',
          contents: [
            { kind: 'block', type: 'arduino_delay' },
            { kind: 'block', type: 'arduino_delayMicroseconds' },
          ],
        },
        {
          kind: 'category',
          name: 'Serial 通訊',
          colour: '120',
          contents: [
            { kind: 'block', type: 'arduino_serial_begin' },
            { kind: 'block', type: 'arduino_serial_print' },
            { kind: 'block', type: 'arduino_serial_available' },
            { kind: 'block', type: 'arduino_serial_read' },
            { kind: 'block', type: 'arduino_serial_read_string' },
          ],
        },
        {
          kind: 'category',
          name: '文字處理',
          colour: '160',
          contents: [
            {
              kind: 'block',
              type: 'text_string',
              fields: {
                TEXT: 'Hello'
              }
            },
            { kind: 'block', type: 'text_join' },
            { kind: 'block', type: 'text_length' },
            { kind: 'block', type: 'text_isEmpty' },
            { kind: 'block', type: 'text_indexOf' },
            { kind: 'block', type: 'text_charAt' },
            { kind: 'block', type: 'text_substring' },
            { kind: 'block', type: 'text_changeCase' },
            { kind: 'block', type: 'text_trim' },
            { kind: 'block', type: 'text_replace' },
            { kind: 'block', type: 'text_number_conversion' },
          ],
        },
        {
          kind: 'category',
          name: '程式結構',
          colour: '290',
          contents: [
            { kind: 'block', type: 'arduino_setup' },
            { kind: 'block', type: 'arduino_loop' },
          ],
        },
        {
          kind: 'category',
          name: '邏輯',
          colour: '210',
          contents: [
            { kind: 'block', type: 'controls_if' },
            { kind: 'block', type: 'logic_compare' },
            { kind: 'block', type: 'logic_operation' },
            { kind: 'block', type: 'logic_negate' },
            { kind: 'block', type: 'logic_boolean' },
          ],
        },
        {
          kind: 'category',
          name: '迴圈',
          colour: '120',
          contents: [
            { kind: 'block', type: 'controls_repeat_ext' },
            { kind: 'block', type: 'controls_whileUntil' },
            { kind: 'block', type: 'controls_for' },
          ],
        },
        {
          kind: 'category',
          name: '數學',
          colour: '230',
          contents: [
            { kind: 'block', type: 'math_number' },
            { kind: 'block', type: 'math_arithmetic' },
            { kind: 'block', type: 'math_single' },
            { kind: 'block', type: 'math_trig' },
            { kind: 'block', type: 'math_constant' },
            { kind: 'block', type: 'arduino_map' },
            { kind: 'block', type: 'arduino_constrain' },
            { kind: 'block', type: 'arduino_min' },
            { kind: 'block', type: 'arduino_max' },
            { kind: 'block', type: 'arduino_abs' },
            { kind: 'block', type: 'arduino_pow' },
            { kind: 'block', type: 'arduino_sqrt' },
          ],
        },
        {
          kind: 'category',
          name: '時間函數',
          colour: '120',
          contents: [
            { kind: 'block', type: 'arduino_millis' },
            { kind: 'block', type: 'arduino_micros' },
          ],
        },
        {
          kind: 'category',
          name: '隨機數',
          colour: '300',
          contents: [
            { kind: 'block', type: 'arduino_random' },
            { kind: 'block', type: 'arduino_random_seed' },
          ],
        },
        {
          kind: 'category',
          name: '變數',
          colour: '330',
          custom: 'VARIABLE',
        },
        {
          kind: 'category',
          name: '變數宣告',
          colour: '310',
          contents: [
            { kind: 'block', type: 'variables_declare' },
            {
              kind: 'block',
              type: 'variables_define',
              inputs: {
                VALUE: {
                  shadow: {
                    type: 'arduino_raw_expression',
                    fields: {
                      CODE: '0'
                    }
                  }
                }
              }
            },
          ],
        },
        {
          kind: 'category',
          name: '函數',
          colour: '290',
          custom: 'PROCEDURE',
        },
        {
          kind: 'category',
          name: '工具',
          colour: '30',
          contents: [
            {
              kind: 'block',
              type: 'arduino_raw_expression',
              fields: {
                CODE: '表達式'
              }
            },
            {
              kind: 'block',
              type: 'arduino_raw_expression_with_expression',
              fields: {
                CODE: '表達式'
              }
            },
            {
              kind: 'block',
              type: 'arduino_raw_statement',
              fields: {
                CODE: '敘述'
              }
            },
            {
              kind: 'block',
              type: 'arduino_raw_statement_with_expression',
              fields: {
                CODE: '敘述'
              }
            },
            {
              kind: 'block',
              type: 'arduino_raw_block',
              fields: {
                CODE: '區塊'
              }
            },
            {
              kind: 'block',
              type: 'arduino_raw_block_with_expression',
              fields: {
                CODE: '區塊'
              }
            },
          ],
        },
      ],
    };
  }
}
