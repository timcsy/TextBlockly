// 簡單的測試執行器 - 直接在這裡實現簡單的解析器測試
console.log('=== 雙向同步快速測試 ===\n');

// 簡化的解析器測試 - 直接執行解析邏輯
function testCodeParsing() {

console.log('=== 雙向同步快速測試 ===\n');

// 測試案例1: 簡單的digitalWrite
const testCode1 = `void setup() {
  digitalWrite(13, HIGH);
  delay(1000);
}

void loop() {
  if (analogRead(A0) > 512) {
    digitalWrite(13, LOW);
  }
}`;

console.log('原始程式碼:');
console.log(testCode1);
console.log('\n');

try {
  // 解析程式碼
  const workspace = parser.parseCode(testCode1);
  console.log('解析結果:');
  console.log('Setup blocks:', workspace.setupBlocks.length);
  console.log('Loop blocks:', workspace.loopBlocks.length);

  console.log('\nSetup blocks詳細:');
  workspace.setupBlocks.forEach((block, index) => {
    console.log(`${index + 1}. ${block.type}`);
    console.log('   Fields:', JSON.stringify(block.fields, null, 2));
    console.log('   Inputs:', JSON.stringify(block.inputs, null, 2));
  });

  console.log('\nLoop blocks詳細:');
  workspace.loopBlocks.forEach((block, index) => {
    console.log(`${index + 1}. ${block.type}`);
    console.log('   Fields:', JSON.stringify(block.fields, null, 2));
    console.log('   Inputs:', JSON.stringify(block.inputs, null, 2));
  });

  // 生成XML
  const xml = parser.blocksToXml(workspace);
  console.log('\n生成的Blockly XML:');
  console.log(xml);

} catch (error) {
  console.error('測試失敗:', error);
  console.error('錯誤堆疊:', error.stack);
}