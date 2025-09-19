// Debug variable conversion
const { ArduinoParser } = require('./compiled/ArduinoParser');
const { ASTToBlocks } = require('./compiled/ASTToBlocks');

console.log('=== 變數轉換調試 ===\n');

const code = `int ledPin = 13;`;

console.log('變數宣告程式碼:');
console.log(code);

try {
  const parser = new ArduinoParser(code);
  const ast = parser.parse();

  console.log('\nAST 變數節點:');
  const varNode = ast.body[0];
  console.log(JSON.stringify(varNode, null, 2));

  const converter = new ASTToBlocks();
  const workspace = converter.convertProgram(ast);

  console.log('\n轉換後的工作區:');
  console.log(`全域變數數量: ${workspace.globalVariables.length}`);

  if (workspace.globalVariables.length > 0) {
    const variable = workspace.globalVariables[0];
    console.log('\n變數詳情:');
    console.log(JSON.stringify(variable, null, 2));
  }

  // 直接測試convertVariableDeclaration方法
  console.log('\n直接調用convertVariableDeclaration:');
  try {
    const result = converter.convertVariableDeclaration(varNode);
    console.log('轉換結果:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.log(`❌ 轉換錯誤: ${error.message}`);
  }

} catch (error) {
  console.log(`❌ 解析錯誤: ${error.message}`);
  console.log('Stack:', error.stack);
}