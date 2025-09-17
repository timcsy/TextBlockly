import { ArduinoCodeParser } from '../arduino/CodeParser';

describe('XML Generation Tests', () => {
  let parser: ArduinoCodeParser;

  beforeEach(() => {
    parser = new ArduinoCodeParser();
  });

  test('should generate correct XML for LED blink code', () => {
    const code = `// Arduino 程式碼
// 由 TextBlockly 自動生成
// 生成時間: 2025/9/16 下午8:47:10

void setup() {
  // 初始化程式碼
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}`;

    const parsed = parser.parseCode(code);
    console.log('Parsed result:');
    console.log('- Setup blocks:', parsed.setupBlocks.length);
    console.log('- Loop blocks:', parsed.loopBlocks.length);
    console.log('- Loop block types:', parsed.loopBlocks.map(b => b.type));

    const xml = parser.blocksToXml(parsed);
    console.log('Generated XML:');
    console.log(xml);

    // 檢查 XML 是否包含所有必要的積木
    expect(xml).toContain('arduino_setup');
    expect(xml).toContain('arduino_loop');
    expect(xml).toContain('arduino_digitalwrite');
    expect(xml).toContain('arduino_delay');

    // 計算 digitalWrite 出現次數（應該是2次）
    const digitalWriteCount = (xml.match(/arduino_digitalwrite/g) || []).length;
    expect(digitalWriteCount).toBe(2);

    // 計算 delay 出現次數（應該是2次）
    const delayCount = (xml.match(/arduino_delay/g) || []).length;
    expect(delayCount).toBe(2);
  });
});