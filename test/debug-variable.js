// Debug variable parsing
const { ArduinoParser } = require('./compiled/ArduinoParser');

console.log('=== 變數解析調試 ===\n');

const code = `int ledPin = 13;`;

console.log('變數宣告程式碼:');
console.log(code);

try {
  const parser = new ArduinoParser(code);
  const ast = parser.parse();

  console.log('\nAST結構:');
  console.log(JSON.stringify(ast, null, 2));

  if (ast.body.length > 0) {
    const varDecl = ast.body[0];
    console.log('\n變數宣告詳情:');
    console.log(`- 類型: ${varDecl.type}`);
    console.log(`- 資料類型: ${varDecl.dataType}`);
    console.log(`- 名稱節點:`, varDecl.name);
    console.log(`- 初始化器:`, varDecl.initializer);
  }

} catch (error) {
  console.log(`❌ 解析錯誤: ${error.message}`);
  console.log('Stack:', error.stack);
}