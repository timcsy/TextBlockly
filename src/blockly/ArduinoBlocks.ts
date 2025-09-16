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
            type: 'field_number',
            name: 'PIN',
            value: 13,
            min: 0,
            max: 53,
            precision: 1,
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
        previousStatement: null,
        nextStatement: null,
        colour: 230,
        tooltip: '設定數位腳位的輸出狀態',
        helpUrl:
          'https://www.arduino.cc/reference/en/language/functions/digital-io/digitalwrite/',
      },
      {
        type: 'arduino_digitalread',
        message0: 'digitalRead 腳位 %1',
        args0: [
          {
            type: 'field_number',
            name: 'PIN',
            value: 2,
            min: 0,
            max: 53,
            precision: 1,
          },
        ],
        output: 'Boolean',
        colour: 230,
        tooltip: '讀取數位腳位的狀態',
        helpUrl:
          'https://www.arduino.cc/reference/en/language/functions/digital-io/digitalread/',
      },
      {
        type: 'arduino_pinmode',
        message0: 'pinMode 腳位 %1 模式 %2',
        args0: [
          {
            type: 'field_number',
            name: 'PIN',
            value: 13,
            min: 0,
            max: 53,
            precision: 1,
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
        previousStatement: null,
        nextStatement: null,
        colour: 230,
        tooltip: '設定腳位的輸入/輸出模式',
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
            type: 'field_dropdown',
            name: 'PIN',
            options: [
              ['A0', 'A0'],
              ['A1', 'A1'],
              ['A2', 'A2'],
              ['A3', 'A3'],
              ['A4', 'A4'],
              ['A5', 'A5'],
            ],
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
            type: 'field_number',
            name: 'PIN',
            value: 9,
            min: 0,
            max: 53,
            precision: 1,
          },
          {
            type: 'field_number',
            name: 'VALUE',
            value: 128,
            min: 0,
            max: 255,
            precision: 1,
          },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: 160,
        tooltip: '輸出 PWM 訊號到指定腳位 (0-255)',
        helpUrl:
          'https://www.arduino.cc/reference/en/language/functions/analog-io/analogwrite/',
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
            { kind: 'block', type: 'arduino_digitalwrite' },
            { kind: 'block', type: 'arduino_digitalread' },
            { kind: 'block', type: 'arduino_pinmode' },
          ],
        },
        {
          kind: 'category',
          name: '類比 I/O',
          colour: '160',
          contents: [
            { kind: 'block', type: 'arduino_analogread' },
            { kind: 'block', type: 'arduino_analogwrite' },
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
          name: '函數',
          colour: '290',
          custom: 'PROCEDURE',
        },
      ],
    };
  }
}
