# Change Log

All notable changes to the "TextBlockly" extension will be documented in this file.

## [0.1.3] - 2025-01-19

### 🐛 Bug Fixes
- **變數名稱問題修復**: 修復了積木轉換回程式碼時出現錯誤變數名稱的問題（如 `K3BqTBQSglavA`）
- **全域變數處理**: 修復了函數內變數被錯誤提升為全域變數的問題
- **語法錯誤修復**: 修復了 JavaScript 中 `mode` 變數重複宣告的語法錯誤
- **積木連接問題**: 修復了 `variables_define` 積木缺少連接屬性導致積木鏈斷裂的問題

### ✨ Features
- **系統性 Arduino 積木**: 新增了完整的 Arduino 函數積木庫
  - 數學函數: `map`, `constrain`, `min`, `max`, `abs`, `pow`, `sqrt`
  - 時間函數: `millis`, `micros`
  - 隨機數函數: `random`, `randomSeed`
  - 擴展 Serial 通信: `Serial.available()`, `Serial.read()`, `Serial.readString()`
- **文字處理積木**: 新增了 11 個文字操作積木
- **改進的錯誤處理**: 增強了 AST 同步過程中的錯誤處理和日誌記錄
- **變數預處理**: 在載入 XML 前預先創建變數，確保名稱一致性

### 🔧 Technical Improvements
- **AST 轉換優化**: 改進了表達式處理，特別是 `MEMBER_EXPRESSION` 類型
- **XML 生成改進**: 優化了積木到 XML 的轉換過程
- **程式碼生成**: 為所有新增的 Arduino 積木實現了完整的程式碼生成
- **積木定義完善**: 添加了缺失的積木定義和工具箱分類

### 📝 Documentation
- **系統設計文件**: 創建了 Arduino 積木系統設計文件
- **測試用例**: 添加了完整的轉換測試和變數處理測試

## [0.1.2] - 2025-01-18

### ✨ Features
- 實現了 Blockly 視覺編輯器與 Arduino 程式碼生成
- 基本的程式碼與積木雙向同步功能
- Arduino 基礎積木集合

### 🔧 Technical
- 基本的 VSCode 擴展架構
- AST 解析和轉換系統
- Blockly 整合

## [0.1.1] - 2025-01-17

### 🏗️ Initial
- 初始 VSCode 擴展結構
- 基本的 TDD 設置

## [0.1.0] - 2025-01-17

### 🎉 First Release
- 初始提交：基本 VSCode 擴展結構