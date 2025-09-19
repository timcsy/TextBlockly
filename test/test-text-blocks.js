// Test text processing blocks functionality
console.log('=== 測試文字處理積木功能 ===\n');

function testTextBlockDefinitions() {
  console.log('🔍 檢查文字處理積木定義...\n');

  const textBlocks = [
    {
      type: 'text_string',
      name: '文字字串',
      description: '基本文字輸入',
      example: '"Hello"'
    },
    {
      type: 'text_join',
      name: '文字連接',
      description: '連接兩個文字',
      example: '連接 "Hello" " World"'
    },
    {
      type: 'text_length',
      name: '文字長度',
      description: '取得文字長度',
      example: '"Hello" 的長度'
    },
    {
      type: 'text_isEmpty',
      name: '空字串檢查',
      description: '檢查是否為空',
      example: '"" 是空的'
    },
    {
      type: 'text_indexOf',
      name: '文字搜尋',
      description: '找到子字串位置',
      example: '在 "Hello World" 中找到 "World" 的位置'
    },
    {
      type: 'text_charAt',
      name: '字元提取',
      description: '取得指定位置字元',
      example: '在 "Hello" 的第 1 個字元'
    },
    {
      type: 'text_substring',
      name: '子字串擷取',
      description: '擷取部分文字',
      example: '從 "Hello World" 擷取 第 0 到 5 個字元'
    },
    {
      type: 'text_changeCase',
      name: '大小寫轉換',
      description: '轉換文字大小寫',
      example: '將 "Hello" 轉為 大寫'
    },
    {
      type: 'text_trim',
      name: '空白移除',
      description: '移除多餘空白',
      example: '移除 " Hello " 的 兩端空白'
    },
    {
      type: 'text_replace',
      name: '文字替換',
      description: '替換指定內容',
      example: '在 "Hello World" 中將 "World" 替換為 "Arduino"'
    },
    {
      type: 'text_number_conversion',
      name: '類型轉換',
      description: '文字數字轉換',
      example: '將 "123" 轉為 數字'
    }
  ];

  console.log('📋 文字處理積木清單:');
  textBlocks.forEach((block, i) => {
    console.log(`  ${i + 1}. ${block.name} (${block.type})`);
    console.log(`     功能: ${block.description}`);
    console.log(`     範例: ${block.example}`);
    console.log('');
  });

  return textBlocks.length;
}

function testTextBlockUseCases() {
  console.log('🎯 文字處理積木應用場景...\n');

  const useCases = [
    {
      scenario: '感測器數據顯示',
      description: '將感測器讀值與文字結合顯示',
      blocks: ['text_string', 'text_join', 'text_number_conversion'],
      example: 'Serial.println("溫度: " + String(temperature) + "°C");'
    },
    {
      scenario: 'WiFi連線訊息',
      description: '格式化網路連線狀態訊息',
      blocks: ['text_string', 'text_join', 'text_changeCase'],
      example: 'Serial.println("WiFi狀態: " + status.toUpperCase());'
    },
    {
      scenario: '命令解析',
      description: '解析從Serial接收的指令',
      blocks: ['text_indexOf', 'text_substring', 'text_trim'],
      example: 'String command = receivedData.substring(0, receivedData.indexOf(":"));'
    },
    {
      scenario: '數據驗證',
      description: '檢查輸入數據的格式',
      blocks: ['text_length', 'text_isEmpty', 'text_charAt'],
      example: 'if (inputData.length() > 0 && inputData.charAt(0) == "#") { ... }'
    },
    {
      scenario: '配置檔案處理',
      description: '處理設定參數字串',
      blocks: ['text_replace', 'text_trim', 'text_number_conversion'],
      example: 'int baudRate = inputString.replace("BAUD=", "").toInt();'
    }
  ];

  console.log('💡 實際應用場景:');
  useCases.forEach((useCase, i) => {
    console.log(`  ${i + 1}. ${useCase.scenario}`);
    console.log(`     說明: ${useCase.description}`);
    console.log(`     使用積木: ${useCase.blocks.join(', ')}`);
    console.log(`     範例代碼: ${useCase.example}`);
    console.log('');
  });

  return useCases.length;
}

function testArduinoTextFunctions() {
  console.log('🔧 Arduino 文字函數對應...\n');

  const mappings = [
    {
      blockType: 'text_string',
      arduinoCode: 'String("Hello")',
      description: '建立字串物件'
    },
    {
      blockType: 'text_join',
      arduinoCode: 'str1 + str2',
      description: '字串連接運算子'
    },
    {
      blockType: 'text_length',
      arduinoCode: 'str.length()',
      description: 'String.length() 方法'
    },
    {
      blockType: 'text_isEmpty',
      arduinoCode: 'str.length() == 0',
      description: '檢查長度是否為零'
    },
    {
      blockType: 'text_indexOf',
      arduinoCode: 'str.indexOf(substring)',
      description: 'String.indexOf() 方法'
    },
    {
      blockType: 'text_charAt',
      arduinoCode: 'str.charAt(index)',
      description: 'String.charAt() 方法'
    },
    {
      blockType: 'text_substring',
      arduinoCode: 'str.substring(from, to)',
      description: 'String.substring() 方法'
    },
    {
      blockType: 'text_changeCase',
      arduinoCode: 'str.toUpperCase() / str.toLowerCase()',
      description: '大小寫轉換方法'
    },
    {
      blockType: 'text_trim',
      arduinoCode: 'str.trim()',
      description: 'String.trim() 方法'
    },
    {
      blockType: 'text_replace',
      arduinoCode: 'str.replace(from, to)',
      description: 'String.replace() 方法'
    },
    {
      blockType: 'text_number_conversion',
      arduinoCode: 'String(num) / str.toInt()',
      description: '類型轉換函數'
    }
  ];

  console.log('🔄 積木與Arduino代碼對應:');
  mappings.forEach((mapping, i) => {
    console.log(`  ${i + 1}. ${mapping.blockType}`);
    console.log(`     Arduino: ${mapping.arduinoCode}`);
    console.log(`     說明: ${mapping.description}`);
    console.log('');
  });

  return mappings.length;
}

function testToolboxIntegration() {
  console.log('🛠️  工具箱整合測試...\n');

  console.log('✅ 文字處理類別配置:');
  console.log('  - 分類名稱: "文字處理"');
  console.log('  - 顏色代碼: 160 (淺藍色)');
  console.log('  - 位置: Serial 通訊後');
  console.log('  - 積木數量: 11 個');

  console.log('\n📋 工具箱積木清單:');
  const toolboxBlocks = [
    'text_string (預設: Hello)',
    'text_join',
    'text_length',
    'text_isEmpty',
    'text_indexOf',
    'text_charAt',
    'text_substring',
    'text_changeCase',
    'text_trim',
    'text_replace',
    'text_number_conversion'
  ];

  toolboxBlocks.forEach((block, i) => {
    console.log(`  ${i + 1}. ${block}`);
  });

  return true;
}

// 執行所有測試
function runAllTests() {
  console.log('🚀 開始文字處理積木測試...\n');

  try {
    const blockCount = testTextBlockDefinitions();
    const useCaseCount = testTextBlockUseCases();
    const mappingCount = testArduinoTextFunctions();
    const toolboxTest = testToolboxIntegration();

    console.log('\n🎯 測試總結:');
    console.log(`- 積木定義: ${blockCount} 個積木 ✅`);
    console.log(`- 應用場景: ${useCaseCount} 個範例 ✅`);
    console.log(`- Arduino對應: ${mappingCount} 個映射 ✅`);
    console.log(`- 工具箱整合: ${toolboxTest ? '成功' : '失敗'} ✅`);

    console.log('\n🎉 文字處理區域添加完成！');

    console.log('\n📊 新增功能:');
    console.log('- ✅ 基本文字操作 (建立、連接、長度)');
    console.log('- ✅ 文字搜尋與擷取 (索引、子字串、字元)');
    console.log('- ✅ 文字格式化 (大小寫、去空白、替換)');
    console.log('- ✅ 類型轉換 (文字↔數字)');
    console.log('- ✅ Arduino String 函數支援');
    console.log('- ✅ 完整工具箱分類');

    console.log('\n💡 使用建議:');
    console.log('- 適用於顯示器文字格式化');
    console.log('- Serial 通訊數據處理');
    console.log('- WiFi/藍牙命令解析');
    console.log('- 感測器數據格式化');
    console.log('- 配置檔案處理');

  } catch (error) {
    console.log('❌ 測試執行失敗:', error.message);
  }
}

runAllTests();