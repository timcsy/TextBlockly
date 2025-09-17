import { ArduinoCodeParser } from '../arduino/CodeParser';

describe('XML Structure Tests', () => {
  let parser: ArduinoCodeParser;

  beforeEach(() => {
    parser = new ArduinoCodeParser();
  });

  test('should generate proper XML structure with next tags', () => {
    const code = `void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}`;

    const parsed = parser.parseCode(code);
    const xml = parser.blocksToXml(parsed);

    console.log('Generated XML:');
    console.log(xml);

    // 檢查 next 標籤的結構
    expect(xml).toContain('<next>');
    expect(xml).toContain('</next>');

    // 檢查積木的順序
    const digitalWriteIndex1 = xml.indexOf('arduino_digitalwrite');
    const delayIndex1 = xml.indexOf('arduino_delay');
    const digitalWriteIndex2 = xml.lastIndexOf('arduino_digitalwrite');
    const delayIndex2 = xml.lastIndexOf('arduino_delay');

    // 第一個 digitalWrite 應該在第一個 delay 之前
    expect(digitalWriteIndex1).toBeLessThan(delayIndex1);
    // 第二個 digitalWrite 應該在第二個 delay 之前
    expect(digitalWriteIndex2).toBeLessThan(delayIndex2);
    // 第一個 delay 應該在第二個 digitalWrite 之前
    expect(delayIndex1).toBeLessThan(digitalWriteIndex2);

    // 檢查積木值
    expect(xml).toMatch(/HIGH.*1000.*LOW.*1000/s);
  });

  test('should generate XML for single block correctly', () => {
    const code = `void setup() {
}

void loop() {
  digitalWrite(13, HIGH);
}`;

    const parsed = parser.parseCode(code);
    const xml = parser.blocksToXml(parsed);

    console.log('Single block XML:');
    console.log(xml);

    // 單個積木不應該有 next 標籤
    const loopContent = xml.match(/<statement name="LOOP_CODE">(.*?)<\/statement>/s);
    expect(loopContent).toBeTruthy();

    if (loopContent) {
      const loopXml = loopContent[1];
      // 在單個積木的情況下，不應該有 <next> 標籤
      expect(loopXml).not.toContain('<next>');
      expect(xml).toContain('arduino_digitalwrite');
      expect(xml).toContain('HIGH');
    }
  });
});