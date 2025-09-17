import { ArduinoCodeParser } from '../arduino/CodeParser';

describe('Exact Issue Reproduction', () => {
  let parser: ArduinoCodeParser;

  beforeEach(() => {
    parser = new ArduinoCodeParser();
  });

  test('should parse the exact code from screenshot', () => {
    const exactCode = `// Arduino 程式碼
// 由 TextBlockly 自動生成
// 生成時間: 2025/9/16 下午8:51:40

void setup() {
  // 初始化程式碼
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, HIGH);
  delay(1000);
}`;

    console.log('=== 解析完全相同的程式碼 ===');

    // 首先測試代碼是否被認為有效
    const isValid = parser.isValidArduinoCode(exactCode);
    console.log('Code is valid:', isValid);

    const parsed = parser.parseCode(exactCode);
    console.log('Setup blocks count:', parsed.setupBlocks.length);
    console.log('Loop blocks count:', parsed.loopBlocks.length);

    console.log('Loop blocks detail:');
    parsed.loopBlocks.forEach((block, index) => {
      console.log(`  Block ${index}: ${block.type}`);
      console.log(`    Fields:`, JSON.stringify(block.fields));
    });

    const xml = parser.blocksToXml(parsed);
    console.log('Generated XML:');
    console.log(xml);

    // 詳細檢查 XML 結構
    const lines = xml.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('arduino_digitalwrite') || line.includes('arduino_delay') || line.includes('<next>')) {
        console.log(`Line ${index}: ${line.trim()}`);
      }
    });

    expect(parsed.loopBlocks).toHaveLength(4);
  });

  test('should test the blocksToXml method directly', () => {
    // 直接創建預期的解析結果
    const mockParsed = {
      setupBlocks: [],
      loopBlocks: [
        { type: 'arduino_digitalwrite', fields: { PIN: '13', STATE: 'HIGH' }, inputs: {} },
        { type: 'arduino_delay', fields: { TIME: '1000' }, inputs: {} },
        { type: 'arduino_digitalwrite', fields: { PIN: '13', STATE: 'HIGH' }, inputs: {} },
        { type: 'arduino_delay', fields: { TIME: '1000' }, inputs: {} }
      ]
    };

    const xml = parser.blocksToXml(mockParsed);
    console.log('Direct blocksToXml result:');
    console.log(xml);

    // 檢查所有積木是否都在 XML 中
    expect(xml).toContain('arduino_digitalwrite');
    expect(xml).toContain('arduino_delay');

    const digitalWriteCount = (xml.match(/arduino_digitalwrite/g) || []).length;
    const delayCount = (xml.match(/arduino_delay/g) || []).length;

    console.log('digitalWrite count in XML:', digitalWriteCount);
    console.log('delay count in XML:', delayCount);

    expect(digitalWriteCount).toBe(2);
    expect(delayCount).toBe(2);
  });
});