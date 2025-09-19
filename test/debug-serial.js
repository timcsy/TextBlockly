// Debug Serial.println parsing
const { ArduinoParser } = require('./compiled/ArduinoParser');

console.log('=== 調試 Serial.println 解析 ===\n');

const code = `void setup() {
  Serial.println("Hello, World!");
}`;

console.log('測試程式碼:');
console.log(code);

try {
  const parser = new ArduinoParser(code);
  const ast = parser.parse();

  console.log('\nAST結構:');
  console.log(JSON.stringify(ast, null, 2));

  // 深入檢查表達式語句
  if (ast.body.length > 0) {
    const stmt = ast.body[0];
    console.log('\n語句類型:', stmt.type);

    if (stmt.type === 'ExpressionStatement') {
      const expr = stmt.expression;
      console.log('表達式類型:', expr.type);

      if (expr.type === 'CallExpression') {
        const callee = expr.callee;
        console.log('被調用者類型:', callee.type);

        if (callee.type === 'MemberExpression') {
          console.log('物件:', callee.object);
          console.log('屬性:', callee.property);
          console.log('屬性名稱:', callee.property.name);
        }
      }
    }
  }

} catch (error) {
  console.log(`❌ 解析錯誤: ${error.message}`);
  console.log('Stack:', error.stack);
}