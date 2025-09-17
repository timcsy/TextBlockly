import { ArduinoCodeParser } from '../arduino/CodeParser';

describe('Real World Parsing Issues', () => {
  let parser: ArduinoCodeParser;

  beforeEach(() => {
    parser = new ArduinoCodeParser();
  });

  test('should parse LED blink code correctly', () => {
    const realCode = `// Arduino 程式碼
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

    console.log('=== 測試真實世界的程式碼解析 ===');
    const parsed = parser.parseCode(realCode);

    console.log('Setup blocks:', JSON.stringify(parsed.setupBlocks, null, 2));
    console.log('Loop blocks:', JSON.stringify(parsed.loopBlocks, null, 2));
    console.log('Loop block count:', parsed.loopBlocks.length);
    console.log('Loop block types:', parsed.loopBlocks.map(b => b.type));

    // 應該有 4 個積木：digitalWrite -> delay -> digitalWrite -> delay
    expect(parsed.loopBlocks).toHaveLength(4);
    expect(parsed.loopBlocks[0].type).toBe('arduino_digitalwrite');
    expect(parsed.loopBlocks[1].type).toBe('arduino_delay');
    expect(parsed.loopBlocks[2].type).toBe('arduino_digitalwrite');
    expect(parsed.loopBlocks[3].type).toBe('arduino_delay');
  });

  test('should parse empty setup with comments', () => {
    const setupCode = `void setup() {
  // 初始化程式碼
}`;

    const parsed = parser.parseCode(setupCode + '\nvoid loop() {}');
    console.log('Setup with comment:', parsed.setupBlocks);

    // setup 中只有註解，應該是空的
    expect(parsed.setupBlocks).toHaveLength(0);
  });
});