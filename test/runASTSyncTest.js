// Simple JavaScript test runner for AST Sync functionality
const { ASTSyncManager } = require('../out/sync/ASTSyncManager');

console.log('=== AST 同步系統實際測試 ===\n');

async function runTests() {
  const syncManager = new ASTSyncManager();

  // 測試案例 1: 基本 setup 函數
  console.log('📋 測試 1: 基本 setup 函數');
  const basicCode = `void setup() {
  digitalWrite(13, HIGH);
  delay(1000);
}`;

  console.log('輸入程式碼:');
  console.log(basicCode);

  try {
    const result = await syncManager.syncCodeToBlocks(basicCode);
    console.log('\n✅ 同步結果:');
    console.log(`- 成功: ${result.success}`);
    if (result.success) {
      console.log(`- Setup積木數量: ${result.workspace.setupBlocks.length}`);
      console.log(`- Loop積木數量: ${result.workspace.loopBlocks.length}`);
      console.log(`- 全域變數數量: ${result.workspace.globalVariables.length}`);
      if (result.warnings && result.warnings.length > 0) {
        console.log('- 警告:', result.warnings);
      }
    } else {
      console.log(`- 錯誤: ${result.error}`);
    }
  } catch (error) {
    console.log(`❌ 測試失敗: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // 測試案例 2: 含全域變數的完整程式
  console.log('📋 測試 2: 含全域變數的完整程式');
  const complexCode = `int ledPin = 13;

void setup() {
  pinMode(ledPin, OUTPUT);
}

void loop() {
  if (digitalRead(2) == HIGH) {
    digitalWrite(ledPin, HIGH);
  } else {
    digitalWrite(ledPin, LOW);
  }
  delay(100);
}`;

  console.log('輸入程式碼:');
  console.log(complexCode);

  try {
    const result = await syncManager.syncCodeToBlocks(complexCode);
    console.log('\n✅ 同步結果:');
    console.log(`- 成功: ${result.success}`);
    if (result.success) {
      console.log(`- Setup積木數量: ${result.workspace.setupBlocks.length}`);
      console.log(`- Loop積木數量: ${result.workspace.loopBlocks.length}`);
      console.log(`- 全域變數數量: ${result.workspace.globalVariables.length}`);

      console.log('\n積木詳情:');
      result.workspace.setupBlocks.forEach((block, i) => {
        console.log(`  Setup[${i}]: ${block.type}`);
      });
      result.workspace.loopBlocks.forEach((block, i) => {
        console.log(`  Loop[${i}]: ${block.type}`);
      });
      result.workspace.globalVariables.forEach((variable, i) => {
        console.log(`  Variable[${i}]: ${variable.name} (${variable.dataType})`);
      });

      if (result.warnings && result.warnings.length > 0) {
        console.log('- 警告:', result.warnings);
      }
    } else {
      console.log(`- 錯誤: ${result.error}`);
    }
  } catch (error) {
    console.log(`❌ 測試失敗: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // 測試案例 3: 錯誤處理
  console.log('📋 測試 3: 錯誤處理');
  const errorCode = `void setup() {
  digitalWrite(13 HIGH);  // 缺少逗號
  delay();               // 缺少參數
}`;

  console.log('輸入含錯誤的程式碼:');
  console.log(errorCode);

  try {
    const result = await syncManager.syncCodeToBlocks(errorCode);
    console.log('\n📊 錯誤處理結果:');
    console.log(`- 成功: ${result.success}`);
    if (result.success) {
      console.log('⚠️  解析器可能過於寬鬆，建議檢查');
      console.log(`- Setup積木數量: ${result.workspace.setupBlocks.length}`);
      console.log(`- 警告數量: ${result.warnings ? result.warnings.length : 0}`);
    } else {
      console.log(`✅ 正確捕獲錯誤: ${result.error}`);
    }
  } catch (error) {
    console.log(`✅ 異常處理正常: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // 測試案例 4: 雙向轉換測試 (Code → Blocks → Code)
  console.log('📋 測試 4: 雙向轉換測試 (AutoEncoder風格)');
  const testCode = `void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}`;

  console.log('原始程式碼:');
  console.log(testCode);

  try {
    // Code → Blocks
    const codeToBlocksResult = await syncManager.syncCodeToBlocks(testCode);

    if (codeToBlocksResult.success) {
      console.log('\n✅ Code → Blocks 成功');

      // Blocks → Code
      const blocksToCodeResult = await syncManager.syncBlocksToCode(codeToBlocksResult.xml);

      if (blocksToCodeResult.success) {
        console.log('✅ Blocks → Code 成功');

        console.log('\n重構後的程式碼:');
        console.log(blocksToCodeResult.code);

        // 比較相似度
        const validation = await syncManager.validateSync(testCode, blocksToCodeResult.code);
        console.log(`\n📊 相似度分析: ${validation.similarity.toFixed(1)}%`);

        if (validation.issues.length > 0) {
          console.log('❌ 發現問題:');
          validation.issues.forEach(issue => console.log(`  - ${issue}`));
        }

        if (validation.recommendations.length > 0) {
          console.log('💡 建議:');
          validation.recommendations.forEach(rec => console.log(`  - ${rec}`));
        }

        // 評估結果
        if (validation.similarity >= 90) {
          console.log('🎉 優秀！相似度達到目標');
        } else if (validation.similarity >= 70) {
          console.log('👍 良好，但還有改進空間');
        } else {
          console.log('⚠️  需要改進轉換精確度');
        }

      } else {
        console.log(`❌ Blocks → Code 失敗: ${blocksToCodeResult.error}`);
      }

    } else {
      console.log(`❌ Code → Blocks 失敗: ${codeToBlocksResult.error}`);
    }

  } catch (error) {
    console.log(`❌ 雙向測試失敗: ${error.message}`);
  }
}

// 執行測試
runTests().then(() => {
  console.log('\n🎯 測試完成');
}).catch(error => {
  console.log(`\n💥 測試執行錯誤: ${error.message}`);
});