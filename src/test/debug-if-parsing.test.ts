import { ArduinoCodeParser } from '../arduino/CodeParser';

describe('Debug If-Else Parsing', () => {
  let parser: ArduinoCodeParser;

  beforeEach(() => {
    parser = new ArduinoCodeParser();
  });

  test('debug if-else parsing step by step', () => {
    const code = `void setup() {
}

void loop() {
  if (digitalRead(2) == HIGH) {
    digitalWrite(13, HIGH);
  } else {
    digitalWrite(13, LOW);
  }
}`;

    console.log('=== Original Code ===');
    console.log(code);

    const parsed = parser.parseCode(code);

    console.log('=== Parsed Loop Blocks ===');
    console.log('Number of loop blocks:', parsed.loopBlocks.length);
    parsed.loopBlocks.forEach((block, index) => {
      console.log(`Block ${index}:`, JSON.stringify(block, null, 2));
    });

    // Add explicit expectations to see the actual values
    expect(parsed.loopBlocks.length).toBeGreaterThanOrEqual(1);
    if (parsed.loopBlocks.length > 0) {
      expect(parsed.loopBlocks[0].type).toBeDefined();
      console.log('First block type:', parsed.loopBlocks[0].type);

      if (parsed.loopBlocks[0].inputs?.ELSE !== undefined) {
        console.log('ELSE input exists:', parsed.loopBlocks[0].inputs.ELSE);
      } else {
        console.log('ELSE input is undefined');
      }
    }

    // Let's test with simpler if-else structure
    const simpleCode = `void setup() {
}

void loop() {
  if (true) {
    digitalWrite(13, HIGH);
  } else {
    digitalWrite(13, LOW);
  }
}`;

    console.log('=== Simple Code Test ===');
    console.log(simpleCode);

    const simpleParsed = parser.parseCode(simpleCode);
    console.log('Number of simple loop blocks:', simpleParsed.loopBlocks.length);
    simpleParsed.loopBlocks.forEach((block, index) => {
      console.log(`Simple Block ${index}:`, JSON.stringify(block, null, 2));
    });
  });
});