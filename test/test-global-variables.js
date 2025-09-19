// 測試全域變數處理
console.log('=== 測試全域變數處理 ===\n');

// 模擬一個包含 loop 內變數的程式碼
const testCode = `
void setup() {
  Serial.begin(9600);
}

void loop() {
  int inChar = Serial.read();
  String inString = "";

  if (Serial.available() > 0) {
    inChar = Serial.read();
    if (isDigit(inChar)) {
      inString += (char)inChar;
    }

    if (inChar == '\n') {
      Serial.print("Value:");
      Serial.println(inString.toInt());
      inString = "";
    }
  }
}
`;

console.log('📝 測試程式碼:');
console.log(testCode);

console.log('\n🔍 分析:');
console.log('這個程式碼包含兩個在 loop 函數內的變數宣告:');
console.log('- int inChar = Serial.read();');
console.log('- String inString = "";');
console.log('');
console.log('修復後，這些變數應該保持在 loop 函數內，不會被提升為全域變數。');
console.log('');
console.log('✅ 如果修復成功，這些變數應該只出現在 loop 函數內，而不是在程式碼頂部。');