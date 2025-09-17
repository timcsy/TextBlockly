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
            check: 'Number',
            shadow: {
              type: 'math_number',
              fields: {
                NUM: 13
              }
            }
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
            check: 'Number',
            shadow: {
              type: 'math_number',
              fields: {
                NUM: 2
              }
            }
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
            check: 'Number',
            shadow: {
              type: 'math_number',
              fields: {
                NUM: 13
              }
            }
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
            check: ['Number', 'String'],
            shadow: {
              type: 'text',
              fields: {
                TEXT: 'A0'
              }
            }
          },
        ],
        output: 'Number',
        colour: 160,
        tooltip: '讀取類比腳位的值 (0-1023)，支援A0-A5或變數',
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
            check: 'Number',
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
            shadow: {
              type: 'math_number',
              fields: {
                NUM: 128
              }
            }
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
            text: 'A0',
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
            text: '',
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
        message0: '%1 %2',
        args0: [
          {
            type: 'field_input',
            name: 'CODE',
            text: '',
            spellcheck: false,
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
        colour: 310,
        tooltip: '定義指定類型的全域變數（在程式碼頂部）',
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
                    type: 'math_number',
                    fields: { NUM: 13 }
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
                    type: 'math_number',
                    fields: { NUM: 2 }
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
                    type: 'math_number',
                    fields: { NUM: 13 }
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
                    type: 'text',
                    fields: { TEXT: 'A0' }
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
                    type: 'math_number',
                    fields: { NUM: 9 }
                  }
                },
                VALUE: {
                  shadow: {
                    type: 'math_number',
                    fields: { NUM: 128 }
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
            { kind: 'block', type: 'variables_define' },
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
              type: 'arduino_raw_statement',
              fields: {
                CODE: 'pinMode(13, OUTPUT);'
              }
            },
            {
              kind: 'block',
              type: 'arduino_raw_expression',
              fields: {
                CODE: 'digitalRead(2)'
              }
            },
            {
              kind: 'block',
              type: 'arduino_raw_block',
              fields: {
                CODE: 'for (int i = 0; i < 10; i++)'
              }
            },
            { kind: 'block', type: 'arduino_pin' },
          ],
        },
      ],
    };
  }
}
