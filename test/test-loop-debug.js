// 測試loop函數轉換的詳細調試
console.log('=== 測試 loop 函數轉換調試 ===\n');

const { ArduinoParser } = require('./compiled/ArduinoParser');
const { ASTToBlocks } = require('./compiled/ASTToBlocks');

const testCode = `
void setup() {
  Serial.begin(9600);
}

void loop() {
  int sensorValue = analogRead(A0);
  float voltage = sensorValue * (5.0 / 1023.0);
  Serial.println(voltage);
}
`;

async function testLoopConversion() {
  console.log('🔍 測試程式碼轉換流程...\n');

  try {
    console.log('步驟1: 解析AST...');
    const parser = new ArduinoParser(testCode);
    const ast = parser.parse();

    console.log(`AST解析完成，頂層節點數: ${ast.body.length}\n`);

    console.log('步驟2: 轉換為積木...');
    const converter = new ASTToBlocks();
    const workspace = converter.convertProgram(ast);

    console.log('\n步驟3: 分析轉換結果...');
    console.log(`Setup積木數量: ${workspace.setupBlocks.length}`);
    console.log(`Loop積木數量: ${workspace.loopBlocks.length}`);
    console.log(`全域變數數量: ${workspace.globalVariables.length}`);

    console.log('\n📋 Setup積木詳情:');
    workspace.setupBlocks.forEach((block, i) => {
      console.log(`  ${i + 1}. 類型: ${block.type}`);
      if (block.fields) console.log(`     欄位:`, block.fields);
      if (block.inputs) console.log(`     輸入:`, block.inputs);
    });

    console.log('\n📋 Loop積木詳情:');
    if (workspace.loopBlocks.length === 0) {
      console.log('  ❌ 沒有loop積木！這就是問題所在');
    } else {
      workspace.loopBlocks.forEach((block, i) => {
        console.log(`  ${i + 1}. 類型: ${block.type}`);
        if (block.fields) console.log(`     欄位:`, block.fields);
        if (block.inputs) console.log(`     輸入:`, block.inputs);
      });
    }

    console.log('\n🎯 診斷結果:');
    if (workspace.setupBlocks.length > 0 && workspace.loopBlocks.length === 0) {
      console.log('- ✅ Setup函數正常轉換');
      console.log('- ❌ Loop函數轉換失敗');
      console.log('- 🔍 可能原因: 變數宣告或複雜表達式轉換問題');
    } else if (workspace.loopBlocks.length > 0) {
      console.log('- ✅ Setup和Loop函數都已轉換');
      console.log('- ✅ 問題已解決');
    } else {
      console.log('- ❌ Setup和Loop函數都轉換失敗');
      console.log('- 🔍 可能是AST解析問題');
    }

  } catch (error) {
    console.log('❌ 轉換測試失敗:', error.message);
    console.log('錯誤堆疊:', error.stack);
  }
}

testLoopConversion();