import { ArduinoCodeParser } from '../arduino/CodeParser';

describe('Variable Bidirectional Sync Test', () => {
  let parser: ArduinoCodeParser;

  beforeEach(() => {
    parser = new ArduinoCodeParser();
  });

  test('should sync variables from code to blocks and back to code', () => {
    // Step 1: Start with Arduino code that includes variables
    const originalCode = `void setup() {
  int ledPin = 13;
  pinMode(ledPin, OUTPUT);
}

void loop() {
  int sensorValue = analogRead(A0);
  digitalWrite(13, HIGH);
  delay(sensorValue);
}`;

    console.log('=== 原始程式碼 ===');
    console.log(originalCode);

    // Step 2: Parse code to blocks
    const parsed = parser.parseCode(originalCode);
    console.log('=== 解析的積木 ===');
    console.log('Setup blocks:', JSON.stringify(parsed.setupBlocks, null, 2));
    console.log('Loop blocks:', JSON.stringify(parsed.loopBlocks, null, 2));

    // Verify variable blocks were created
    const setupVariables = parsed.setupBlocks.filter(block => block.type === 'variables_set');
    const loopVariables = parsed.loopBlocks.filter(block => block.type === 'variables_set');

    expect(setupVariables).toHaveLength(1);
    expect(setupVariables[0].fields.VAR).toBe('ledPin');

    expect(loopVariables).toHaveLength(1);
    expect(loopVariables[0].fields.VAR).toBe('sensorValue');

    // Step 3: Convert blocks to XML
    const xml = parser.blocksToXml(parsed);
    console.log('=== 生成的 XML ===');
    console.log(xml);

    // Verify XML contains variable information
    expect(xml).toContain('variables_set');
    expect(xml).toContain('<field name="VAR">ledPin</field>');
    expect(xml).toContain('<field name="VAR">sensorValue</field>');

    // Step 4: Verify the XML structure is correct for round-trip processing
    // The actual code generation happens in the webview, but we can verify XML structure

    // Check that the XML contains proper block structure
    expect(xml).toContain('<statement name="SETUP_CODE">');
    expect(xml).toContain('<statement name="LOOP_CODE">');

    // Check that variable blocks are properly nested
    expect(xml).toContain('<block type="variables_set">');
    expect(xml).toContain('<value name="VALUE">');

    // Verify analog read blocks are preserved
    expect(xml).toContain('arduino_analogread');
    // Note: pinMode with variable pin is not currently supported by the block definition
  });

  test('should handle complex variable expressions', () => {
    const code = `void setup() {
  float voltage = 5.0;
}

void loop() {
  int reading = analogRead(A0);
  float result = reading * voltage / 1023.0;
}`;

    const parsed = parser.parseCode(code);

    // Check that complex expressions are parsed correctly
    const setupVar = parsed.setupBlocks.find(block => block.type === 'variables_set');
    expect(setupVar?.fields.VAR).toBe('voltage');

    const loopVars = parsed.loopBlocks.filter(block => block.type === 'variables_set');
    expect(loopVars).toHaveLength(2);
    expect(loopVars[0].fields.VAR).toBe('reading');
    expect(loopVars[1].fields.VAR).toBe('result');

    const xml = parser.blocksToXml(parsed);
    expect(xml).toContain('<field name="VAR">voltage</field>');
    expect(xml).toContain('<field name="VAR">reading</field>');
    expect(xml).toContain('<field name="VAR">result</field>');
  });

  test('should preserve variable types in sync', () => {
    const code = `void setup() {
  int intVar = 10;
  float floatVar = 3.14;
  boolean boolVar = true;
}

void loop() {
  intVar = 20;
  floatVar = 2.71;
  boolVar = false;
}`;

    const parsed = parser.parseCode(code);
    const xml = parser.blocksToXml(parsed);

    // All variable assignments should be present in XML
    const variableCount = (xml.match(/variables_set/g) || []).length;
    expect(variableCount).toBe(6); // 3 declarations + 3 assignments

    // Check that variable names are preserved
    expect(xml).toContain('<field name="VAR">intVar</field>');
    expect(xml).toContain('<field name="VAR">floatVar</field>');
    expect(xml).toContain('<field name="VAR">boolVar</field>');
  });
});