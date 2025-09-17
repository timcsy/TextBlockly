import { ArduinoCodeParser } from '../arduino/CodeParser';

describe('Debug Specific If-Else Issue', () => {
  test('debug extractBlockBody and remainingCode calculation', () => {
    const parser = new ArduinoCodeParser();

    // Test the exact problematic code
    const afterCondition = `{
    digitalWrite(13, HIGH);
  } else {
    digitalWrite(13, LOW);
  }`;

    console.log('afterCondition:', afterCondition);

    // Manually test extractBlockBody (accessing private method for debugging)
    const extractMethod = (parser as any).extractBlockBody;
    const ifBody = extractMethod.call(parser, afterCondition);

    console.log('ifBody result:', ifBody);
    console.log('ifBody length:', ifBody?.length);

    // Test the remainingCode calculation
    if (ifBody) {
      const remainingCode = afterCondition.substring(ifBody.length + 2).trim();
      console.log('Calculated remainingCode:', remainingCode);
      console.log('Should start with "else":', remainingCode.startsWith('else'));
    }

    expect(ifBody).toBeTruthy();
  });

  test('test full if statement parsing', () => {
    const parser = new ArduinoCodeParser();

    const fullIfStatement = `if (digitalRead(2) == HIGH) {
    digitalWrite(13, HIGH);
  } else {
    digitalWrite(13, LOW);
  }`;

    console.log('Full if statement:', fullIfStatement);

    // Access the private parseIfStatement method
    const parseMethod = (parser as any).parseIfStatement;
    const result = parseMethod.call(parser, fullIfStatement);

    console.log('Parse result:', JSON.stringify(result, null, 2));

    expect(result).toBeTruthy();
    expect(result.type).toBe('controls_if');

    // This should NOT be undefined if parsing is working correctly
    if (result.inputs?.ELSE === undefined) {
      console.log('ERROR: ELSE input is undefined - parsing failed');
    } else {
      console.log('SUCCESS: ELSE input exists');
    }
  });
});