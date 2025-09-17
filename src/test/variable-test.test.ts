import { ArduinoCodeParser } from '../arduino/CodeParser';

describe('Variable functionality test', () => {
  let parser: ArduinoCodeParser;

  beforeEach(() => {
    parser = new ArduinoCodeParser();
  });

  test('should parse variable declarations and assignments', () => {
    const code = `void setup() {
  int sensor = 0;
  float temperature = 25.5;
}

void loop() {
  sensor = analogRead(A0);
  temperature = sensor * 0.1;
}`;

    console.log('=== 測試變數解析 ===');

    const parsed = parser.parseCode(code);
    console.log('Setup blocks:', JSON.stringify(parsed.setupBlocks, null, 2));
    console.log('Loop blocks:', JSON.stringify(parsed.loopBlocks, null, 2));

    // 檢查變數賦值是否正確解析
    const variableAssignments = parsed.loopBlocks.filter(block => block.type === 'variables_set');
    expect(variableAssignments).toHaveLength(2);

    // 檢查第一個變數賦值
    expect(variableAssignments[0].fields.VAR).toBe('sensor');

    // 檢查第二個變數賦值
    expect(variableAssignments[1].fields.VAR).toBe('temperature');
  });

  test('should generate XML with variables correctly', () => {
    const mockParsed = {
      setupBlocks: [
        {
          type: 'variables_set',
          fields: { VAR: 'sensor' },
          inputs: {
            VALUE: {
              type: 'math_number',
              fields: { NUM: '0' },
              inputs: {}
            }
          }
        }
      ],
      loopBlocks: [
        {
          type: 'variables_set',
          fields: { VAR: 'sensor' },
          inputs: {
            VALUE: {
              type: 'arduino_analogread',
              fields: { PIN: 'A0' },
              inputs: {}
            }
          }
        }
      ]
    };

    console.log('=== 測試變數 XML 生成 ===');

    const xml = parser.blocksToXml(mockParsed);
    console.log('Generated XML:');
    console.log(xml);

    // 檢查變數積木是否在 XML 中
    expect(xml).toContain('variables_set');
    expect(xml).toContain('<field name="VAR">sensor</field>');
    expect(xml).toContain('arduino_analogread');
    expect(xml).toContain('math_number');
  });

  test('should handle variable usage in expressions', () => {
    const code = `void setup() {
  int a = 10;
  int b = 20;
}

void loop() {
  int result = a + b;
}`;

    console.log('=== 測試變數表達式 ===');

    const parsed = parser.parseCode(code);
    console.log('Loop blocks:', JSON.stringify(parsed.loopBlocks, null, 2));

    const variableSet = parsed.loopBlocks.find(block => block.type === 'variables_set');
    expect(variableSet).toBeDefined();
    expect(variableSet?.fields.VAR).toBe('result');
  });
});