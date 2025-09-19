// 測試loop函數轉換問題的調試
console.log('=== 調試 loop 函數轉換問題 ===\n');

const testCode = `
// the setup routine runs once when you press reset:
void setup() {
  // initialize serial communication at 9600 bits per second:
  Serial.begin(9600);
}

// the loop routine runs over and over again forever:
void loop() {
  // read the input on analog pin 0:
  int sensorValue = analogRead(A0);
  // Convert the analog reading (which goes from 0 - 1023) to a voltage (0 - 5V):
  float voltage = sensorValue * (5.0 / 1023.0);
  // print out the value you read:
  Serial.println(voltage);
}
`;

// 模擬AST解析
console.log('🔍 分析程式碼結構...\n');
console.log('程式碼:');
console.log(testCode);

console.log('\n📋 預期的loop函數內容:');
console.log('1. int sensorValue = analogRead(A0);');
console.log('2. float voltage = sensorValue * (5.0 / 1023.0);');
console.log('3. Serial.println(voltage);');

console.log('\n🔄 檢查轉換問題:');

const loopStatements = [
  {
    type: 'VariableDeclaration',
    statement: 'int sensorValue = analogRead(A0);',
    expectedBlock: 'variables_define',
    issue: '變數宣告和初始化可能未正確處理'
  },
  {
    type: 'VariableDeclaration',
    statement: 'float voltage = sensorValue * (5.0 / 1023.0);',
    expectedBlock: 'variables_define + math_arithmetic',
    issue: '複雜的數學運算表達式可能未轉換'
  },
  {
    type: 'ExpressionStatement',
    statement: 'Serial.println(voltage);',
    expectedBlock: 'arduino_serial_print',
    issue: '這個應該可以正常轉換'
  }
];

console.log('可能的轉換問題:');
loopStatements.forEach((stmt, i) => {
  console.log(`  ${i + 1}. ${stmt.statement}`);
  console.log(`     類型: ${stmt.type}`);
  console.log(`     預期積木: ${stmt.expectedBlock}`);
  console.log(`     可能問題: ${stmt.issue}`);
  console.log('');
});

console.log('🎯 診斷結果:');
console.log('- ✅ Serial.println(voltage) 應該正常轉換');
console.log('- ❌ 變數宣告可能被忽略或處理不當');
console.log('- ❌ 數學運算表達式可能未正確解析');
console.log('- ❌ analogRead(A0) 函數調用可能有問題');

console.log('\n💡 需要檢查的部分:');
console.log('1. convertVariableDeclaration 是否正確處理帶初始值的宣告');
console.log('2. convertExpression 是否支援複雜的數學運算');
console.log('3. convertCallExpression 是否支援 analogRead');
console.log('4. BinaryExpression 的轉換是否正常');

console.log('\n🔧 建議修復:');
console.log('- 檢查 ASTToBlocks.ts 中的 convertStatement 方法');
console.log('- 確保變數宣告語句被正確識別和轉換');
console.log('- 檢查數學運算和函數調用的轉換邏輯');
console.log('- 添加更詳細的調試日誌');