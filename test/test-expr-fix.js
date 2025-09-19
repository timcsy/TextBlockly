// Test the expr bug fix
console.log('=== 測試 expr 問題修復 ===\n');

const { ArduinoParser } = require('./compiled/ArduinoParser');
const { ASTToBlocks } = require('./compiled/ASTToBlocks');

// 測試 Serial.println 轉換
const testCode = `void setup() {
  Serial.begin(9600);
}

void loop() {
  if (analogRead(A0) == 0) {
    delay(1000);
    Serial.println("Hello, World!");
  }
}`;

console.log('測試程式碼 (包含 Serial.println):');
console.log(testCode);

try {
  const parser = new ArduinoParser(testCode);
  const ast = parser.parse();

  console.log('\n✅ 解析成功!');

  const converter = new ASTToBlocks();
  const workspace = converter.convertProgram(ast);

  console.log('\n✅ 轉換成功!');
  console.log(`Setup積木數量: ${workspace.setupBlocks.length}`);
  console.log(`Loop積木數量: ${workspace.loopBlocks.length}`);

  console.log('\nSetup積木詳情:');
  workspace.setupBlocks.forEach((block, i) => {
    console.log(`  ${i + 1}. ${block.type}`);
    if (block.fields) {
      Object.entries(block.fields).forEach(([key, value]) => {
        console.log(`     ${key}: ${value}`);
      });
    }
    if (block.inputs) {
      Object.entries(block.inputs).forEach(([key, value]) => {
        console.log(`     ${key}: ${JSON.stringify(value)}`);
      });
    }
  });

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
        console.log(`     ${key}:`, typeof value === 'object' ? JSON.stringify(value, null, 4) : value);
      });
    }
  });

  // 檢查是否還有 expr 問題
  const jsonStr = JSON.stringify(workspace, null, 2);
  if (jsonStr.includes('expr(')) {
    console.log('\n❌ 仍然發現 expr() 問題！');
    console.log('位置:', jsonStr.indexOf('expr('));
  } else {
    console.log('\n✅ 沒有發現 expr() 問題！');
  }

} catch (error) {
  console.log(`❌ 測試失敗: ${error.message}`);
  console.log('Stack:', error.stack);
}