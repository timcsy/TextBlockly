import { ArduinoCodeParser } from '../arduino/CodeParser';

describe('Simple Debug Tests', () => {
  let parser: ArduinoCodeParser;

  beforeEach(() => {
    parser = new ArduinoCodeParser();
  });

  test('should parse simple if statement', () => {
    const code = `if (digitalRead(2) == HIGH) {
  digitalWrite(13, HIGH);
}`;

    // 測試解析器內部方法
    const parseMethod = (parser as any).parseStructuredStatements;
    const result = parseMethod.call(parser, code);

    console.log('Direct parseStructuredStatements result:', result);
    console.log('Block types:', result.map((b: any) => b.type));

    expect(result.length).toBeGreaterThan(0);
  });

  test('should find if statements', () => {
    const code = `if (digitalRead(2) == HIGH) {
  digitalWrite(13, HIGH);
}`;

    // 測試查找方法
    const findMethod = (parser as any).findCompleteStatements;
    const ifMatches = findMethod.call(parser, code, 'if');

    console.log('Found if matches:', ifMatches);

    expect(ifMatches.length).toBe(1);
  });

  test('should parse if statement directly', () => {
    const ifStatement = `if (digitalRead(2) == HIGH) {
  digitalWrite(13, HIGH);
}`;

    // 測試直接解析 if 語句
    const parseIfMethod = (parser as any).parseIfStatement;
    const result = parseIfMethod.call(parser, ifStatement);

    console.log('Direct parseIfStatement result:', result);

    expect(result).toBeDefined();
    expect(result.type).toBe('controls_if');
  });
});