// Debug actual code from screenshot
const { ArduinoParser } = require('./compiled/ArduinoParser');
const { ASTToBlocks } = require('./compiled/ASTToBlocks');

console.log('=== 調試實際截圖程式碼 ===\n');

const code = `void setup() {
  // 初始化程式碼
}

void loop() {
  // 主要程式迴圈
  Serial.print("Hello, World!");
  delay(1000); // 延遲1秒
}`;

console.log('實際程式碼:');
console.log(code);

try {
  const parser = new ArduinoParser(code);
  const ast = parser.parse();

  console.log('\n✅ 解析成功!');

  const converter = new ASTToBlocks();
  const workspace = converter.convertProgram(ast);

  console.log('\n✅ 轉換成功!');

  console.log('\nLoop積木詳情:');
  workspace.loopBlocks.forEach((block, i) => {
    console.log(`  ${i + 1}. ${block.type}`);
    if (block.fields) {
      Object.entries(block.fields).forEach(([key, value]) => {
        console.log(`     ${key}: ${value}`);
      });
    }
    if (block.inputs) {
      Object.entries(block.inputs).forEach(([key, value]) => {
        console.log(`     ${key}:`);
        console.log('        ', JSON.stringify(value, null, 8));
      });
    }
  });

  // 重點查看 Serial.print 是否正確
  const serialBlock = workspace.loopBlocks.find(b => b.type === 'arduino_serial_print');
  if (serialBlock) {
    console.log('\n🔍 Serial積木詳細分析:');
    console.log('積木類型:', serialBlock.type);
    console.log('字段:', serialBlock.fields);
    console.log('輸入:', JSON.stringify(serialBlock.inputs, null, 2));
  }

} catch (error) {
  console.log(`❌ 測試失敗: ${error.message}`);
  console.log('Stack:', error.stack);
}