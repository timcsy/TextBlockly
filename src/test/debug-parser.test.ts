import { ArduinoCodeParser } from '../arduino/CodeParser';

describe('Debug Parser Issues', () => {
  let parser: ArduinoCodeParser;

  beforeEach(() => {
    parser = new ArduinoCodeParser();
  });

  test('should debug if statement parsing', () => {
    const simpleIfCode = `
void setup() {
}

void loop() {
  if (digitalRead(2) == HIGH) {
    digitalWrite(13, HIGH);
  }
}`;

    const parsed = parser.parseCode(simpleIfCode);

    // 檢查實際解析結果
    expect(parsed.loopBlocks.length).toBeGreaterThanOrEqual(1);

    // 記錄實際類型以便調試
    const blockTypes = parsed.loopBlocks.map(b => b.type);
    console.log('Actual block types:', blockTypes);

    // 如果第一個積木不是 if 語句，這就是問題所在
    if (parsed.loopBlocks[0]?.type !== 'controls_if') {
      console.log('Problem: Expected controls_if but got:', parsed.loopBlocks[0]?.type);
      console.log('Full block:', JSON.stringify(parsed.loopBlocks[0], null, 2));
    }
  });

  test('should debug for loop parsing', () => {
    const simpleForCode = `
void setup() {
}

void loop() {
  for (int i = 0; i < 5; i++) {
    digitalWrite(13, HIGH);
  }
}`;

    console.log('=== Debugging For Loop ===');
    const parsed = parser.parseCode(simpleForCode);
    console.log('Loop blocks:', JSON.stringify(parsed.loopBlocks, null, 2));
    console.log('Loop block types:', parsed.loopBlocks.map(b => b.type));

    expect(parsed.loopBlocks).toHaveLength(1);
  });

  test('should debug variable assignment', () => {
    const varCode = `
void setup() {
}

void loop() {
  int value = analogRead(A0);
  analogWrite(9, value);
}`;

    console.log('=== Debugging Variable Assignment ===');
    const parsed = parser.parseCode(varCode);
    console.log('Loop blocks:', JSON.stringify(parsed.loopBlocks, null, 2));
    console.log('Loop block types:', parsed.loopBlocks.map(b => b.type));

    // 應該有兩個積木：變數賦值和 analogWrite
    expect(parsed.loopBlocks.length).toBeGreaterThanOrEqual(1);
  });
});