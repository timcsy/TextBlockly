import { ArduinoCodeParser } from '../arduino/CodeParser';

describe('Fields and Values Test', () => {
  let parser: ArduinoCodeParser;

  beforeEach(() => {
    parser = new ArduinoCodeParser();
  });

  test('should preserve block fields in XML', () => {
    const code = `void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
}`;

    const parsed = parser.parseCode(code);

    console.log('=== 檢查解析的積木字段 ===');
    console.log('Setup blocks:', JSON.stringify(parsed.setupBlocks, null, 2));
    console.log('Loop blocks:', JSON.stringify(parsed.loopBlocks, null, 2));

    // 檢查字段是否正確解析
    expect(parsed.setupBlocks[0].fields.PIN).toBe('13');
    expect(parsed.setupBlocks[0].fields.MODE).toBe('OUTPUT');

    expect(parsed.loopBlocks[0].fields.PIN).toBe('13');
    expect(parsed.loopBlocks[0].fields.STATE).toBe('HIGH');
    expect(parsed.loopBlocks[1].fields.TIME).toBe('1000');

    const xml = parser.blocksToXml(parsed);
    console.log('=== 檢查生成的 XML ===');
    console.log(xml);

    // 檢查 XML 中是否包含字段值
    expect(xml).toContain('<field name="PIN">13</field>');
    expect(xml).toContain('<field name="MODE">OUTPUT</field>');
    expect(xml).toContain('<field name="STATE">HIGH</field>');
    expect(xml).toContain('<field name="TIME">1000</field>');
  });

  test('should test generateBlockChain with fields', () => {
    const mockBlocks = [
      {
        type: 'arduino_digitalwrite',
        fields: { PIN: '13', STATE: 'HIGH' },
        inputs: {}
      },
      {
        type: 'arduino_delay',
        fields: { TIME: '1000' },
        inputs: {}
      }
    ];

    // 測試 generateBlockChain 方法
    const generateMethod = (parser as any).generateBlockChain;
    const result = generateMethod.call(parser, mockBlocks, 6);

    console.log('=== generateBlockChain 結果 ===');
    console.log(result);

    // 檢查字段是否被包含
    expect(result).toContain('PIN');
    expect(result).toContain('13');
    expect(result).toContain('HIGH');
    expect(result).toContain('TIME');
    expect(result).toContain('1000');
  });
});