// Test the actual AST implementation
console.log('=== 實際 AST 實現測試 ===\n');

const { ArduinoTokenizer } = require('./compiled/ArduinoTokenizer');
const { ArduinoParser } = require('./compiled/ArduinoParser');
const { ASTToBlocks } = require('./compiled/ASTToBlocks');

async function testTokenizer() {
  console.log('📋 測試 1: ArduinoTokenizer');

  const code = `void setup() {
  digitalWrite(13, HIGH);
  delay(1000);
}`;

  console.log('輸入程式碼:');
  console.log(code);

  try {
    const tokenizer = new ArduinoTokenizer(code);
    const tokens = tokenizer.tokenize();

    console.log('\n✅ Tokenization 成功!');
    console.log(`Token 數量: ${tokens.length}`);

    console.log('\nToken 詳情:');
    tokens.forEach((token, i) => {
      console.log(`  ${i + 1}. ${token.type}: "${token.value}" (${token.line}:${token.column})`);
    });

    return tokens;
  } catch (error) {
    console.log(`❌ Tokenizer 錯誤: ${error.message}`);
    return null;
  }
}

async function testParser() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 測試 2: ArduinoParser');

  const code = `void setup() {
  digitalWrite(13, HIGH);
  delay(1000);
}`;

  try {
    const parser = new ArduinoParser(code);
    const ast = parser.parse();

    console.log('\n✅ Parser 成功!');
    console.log(`AST 類型: ${ast.type}`);
    console.log(`頂層節點數: ${ast.body.length}`);

    console.log('\nAST 結構:');
    console.log(JSON.stringify(ast, null, 2));

    return ast;
  } catch (error) {
    console.log(`❌ Parser 錯誤: ${error.message}`);
    console.log('Stack:', error.stack);
    return null;
  }
}

async function testASTToBlocks(ast) {
  console.log('\n' + '='.repeat(60));
  console.log('📋 測試 3: ASTToBlocks');

  if (!ast) {
    console.log('❌ 無法測試 ASTToBlocks - AST 為空');
    return;
  }

  try {
    const converter = new ASTToBlocks();
    const workspace = converter.convertProgram(ast);

    console.log('\n✅ AST to Blocks 轉換成功!');
    console.log(`Setup 積木數量: ${workspace.setupBlocks.length}`);
    console.log(`Loop 積木數量: ${workspace.loopBlocks.length}`);
    console.log(`全域變數數量: ${workspace.globalVariables.length}`);

    console.log('\nSetup 積木:');
    workspace.setupBlocks.forEach((block, i) => {
      console.log(`  ${i + 1}. ${block.type}`);
      if (block.fields) {
        Object.entries(block.fields).forEach(([key, value]) => {
          console.log(`     ${key}: ${value}`);
        });
      }
    });

    console.log('\nLoop 積木:');
    workspace.loopBlocks.forEach((block, i) => {
      console.log(`  ${i + 1}. ${block.type}`);
    });

    return workspace;
  } catch (error) {
    console.log(`❌ ASTToBlocks 錯誤: ${error.message}`);
    console.log('Stack:', error.stack);
    return null;
  }
}

async function testComplexCode() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 測試 4: 複雜程式碼');

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

  console.log('複雜程式碼:');
  console.log(complexCode);

  try {
    const parser = new ArduinoParser(complexCode);
    const ast = parser.parse();

    console.log('\n✅ 複雜程式碼解析成功!');
    console.log(`頂層節點數: ${ast.body.length}`);

    // 分析節點類型
    const nodeTypes = {};
    ast.body.forEach(node => {
      nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
    });

    console.log('\n節點類型統計:');
    Object.entries(nodeTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    const converter = new ASTToBlocks();
    const workspace = converter.convertProgram(ast);

    console.log('\n✅ 複雜程式碼轉換成功!');
    console.log(`Setup 積木: ${workspace.setupBlocks.length}`);
    console.log(`Loop 積木: ${workspace.loopBlocks.length}`);
    console.log(`全域變數: ${workspace.globalVariables.length}`);

    // 詳細分析
    console.log('\n全域變數詳情:');
    workspace.globalVariables.forEach((variable, i) => {
      const name = variable.fields?.VAR || 'unknown';
      const type = variable.fields?.TYPE || 'unknown';
      const value = variable.inputs?.VALUE?.fields?.NUM || variable.inputs?.VALUE || 'no value';
      console.log(`  ${i + 1}. ${name} (${type}) = ${value}`);
    });

    return { ast, workspace };
  } catch (error) {
    console.log(`❌ 複雜程式碼測試失敗: ${error.message}`);
    console.log('Stack:', error.stack);
    return null;
  }
}

// 執行所有測試
async function runAllTests() {
  console.log('🚀 開始執行所有 AST 測試...\n');

  const tokens = await testTokenizer();
  const ast = await testParser();
  const workspace = await testASTToBlocks(ast);
  const complexResult = await testComplexCode();

  console.log('\n' + '='.repeat(60));
  console.log('🎯 測試總結');

  if (tokens) {
    console.log('✅ Tokenizer: 通過');
  } else {
    console.log('❌ Tokenizer: 失敗');
  }

  if (ast) {
    console.log('✅ Parser: 通過');
  } else {
    console.log('❌ Parser: 失敗');
  }

  if (workspace) {
    console.log('✅ ASTToBlocks: 通過');
  } else {
    console.log('❌ ASTToBlocks: 失敗');
  }

  if (complexResult) {
    console.log('✅ 複雜程式碼: 通過');
  } else {
    console.log('❌ 複雜程式碼: 失敗');
  }

  console.log('\n🏁 測試完成');
}

runAllTests().catch(error => {
  console.error('💥 測試執行失敗:', error.message);
  console.error('Stack:', error.stack);
});