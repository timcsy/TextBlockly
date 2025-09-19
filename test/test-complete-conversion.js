// 測試完整的程式碼到積木轉換流程
console.log('=== 測試完整程式碼到積木轉換流程 ===\n');

const { ASTSyncManager } = require('../out/sync/ASTSyncManager');

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

async function testCompleteConversion() {
  console.log('🔍 測試完整轉換流程（程式碼 → AST → 積木 → XML）...\n');

  try {
    const syncManager = new ASTSyncManager();

    console.log('輸入程式碼:');
    console.log(testCode);
    console.log('');

    console.log('開始轉換...');
    const result = await syncManager.syncCodeToBlocks(testCode);

    console.log('\n📊 轉換結果:');
    console.log(`- 成功: ${result.success}`);
    console.log(`- XML長度: ${result.xml ? result.xml.length : 0}`);

    if (result.error) {
      console.log(`- 錯誤: ${result.error}`);
    }

    if (result.warnings && result.warnings.length > 0) {
      console.log(`- 警告: ${result.warnings.join(', ')}`);
    }

    if (result.workspace) {
      console.log(`- Setup積木數量: ${result.workspace.setupBlocks.length}`);
      console.log(`- Loop積木數量: ${result.workspace.loopBlocks.length}`);
      console.log(`- 全域變數數量: ${result.workspace.globalVariables.length}`);
    }

    if (result.xml) {
      console.log('\n📋 生成的XML:');
      console.log(result.xml);
    }

    console.log('\n🎯 分析:');
    if (result.success && result.xml && result.xml.includes('LOOP_CODE')) {
      if (result.xml.includes('variables_define') && result.xml.includes('arduino_serial_print')) {
        console.log('- ✅ 轉換成功！loop積木包含所有預期內容');
        console.log('- ✅ 變數宣告積木已生成');
        console.log('- ✅ Serial.println積木已生成');
      } else {
        console.log('- ⚠️  轉換部分成功，但可能缺少某些積木');
      }
    } else if (result.success && result.xml) {
      console.log('- ⚠️  轉換成功但loop積木可能為空');
    } else {
      console.log('- ❌ 轉換失敗');
    }

  } catch (error) {
    console.log('❌ 測試失敗:', error.message);
    console.log('錯誤堆疊:', error.stack);
  }
}

testCompleteConversion();