// 測試變數名稱處理
console.log('=== 測試變數名稱處理 ===\n');

const { ASTSyncManager } = require('../out/sync/ASTSyncManager');

const testCode = `
void setup() {
  Serial.begin(9600);
}

void loop() {
  int sensorValue = analogRead(A0);
  float voltage = sensorValue * 5.0 / 1023.0;
  Serial.println(voltage);
}
`;

async function testVariableNames() {
  console.log('🔍 測試變數名稱轉換...\n');

  try {
    const syncManager = new ASTSyncManager();

    console.log('輸入程式碼:');
    console.log(testCode);
    console.log('');

    const result = await syncManager.syncCodeToBlocks(testCode);

    console.log('\\n📊 轉換結果:');
    console.log(`- 成功: ${result.success}`);

    if (result.xml) {
      console.log('\\n🔍 檢查變數名稱:');

      // 尋找變數定義
      const varDefMatches = result.xml.match(/<field name="VAR">([^<]+)<\/field>/g);
      if (varDefMatches) {
        console.log('找到的變數定義:');
        varDefMatches.forEach((match, index) => {
          const varName = match.match(/<field name="VAR">([^<]+)<\/field>/)[1];
          console.log(`  ${index + 1}. 變數名稱: "${varName}"`);
        });
      } else {
        console.log('❌ 沒有找到變數定義');
      }

      // 檢查是否有奇怪的變數名稱
      if (result.xml.includes('K3BqTBQSglavA') || result.xml.includes('RGJQ3Z2o6hZS0a1')) {
        console.log('❌ 發現奇怪的變數名稱！');
      } else {
        console.log('✅ 變數名稱看起來正常');
      }
    }

  } catch (error) {
    console.log('❌ 測試失敗:', error.message);
  }
}

testVariableNames();