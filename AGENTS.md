# TextBlockly 開發資訊與代理人配置

## 專案資訊

- **專案名稱**: TextBlockly
- **專案類型**: VSCode 擴展
- **開發語言**: TypeScript
- **開發方法**: 測試驅動開發 (TDD)
- **目標平台**: Visual Studio Code
- **核心技術**: Blockly, VSCode Extension API, Webview

## 架構概覽

```
TextBlockly/
├── src/                    # 源程式碼
│   ├── extension.ts       # 主要擴展入口
│   ├── webview/           # Webview 相關
│   ├── blockly/           # Blockly 整合
│   ├── template/          # 模板管理系統
│   ├── sync/              # 雙向同步引擎
│   └── arduino/           # Arduino 專用功能
├── test/                  # 測試檔案
├── resources/             # 靜態資源
├── package.json           # 擴展清單
└── webpack.config.js      # 打包設定
```

## 核心模組設計

### 1. Extension Core (`src/extension.ts`)
- 擴展激活與停用
- 命令註冊
- Webview 生命週期管理

### 2. Blockly Integration (`src/blockly/`)
- Blockly 工作區管理
- Arduino 積木定義
- 積木分類系統
- 自定義積木支援

### 3. Template Management (`src/template/`)
- 模板資料模型
- 分類管理系統
- 模板 CRUD 操作
- 匯入/匯出功能

### 4. Code Synchronization (`src/sync/`)
- 程式碼生成器
- 程式碼解析器
- 雙向同步邏輯
- 衝突解決機制

### 5. Arduino Support (`src/arduino/`)
- Arduino 程式碼生成
- .ino 檔案處理
- Arduino 特定積木

## 開發規範

### 測試驅動開發流程
1. **Red**: 寫一個失敗的測試
2. **Green**: 寫最少的程式碼讓測試通過
3. **Refactor**: 重構程式碼保持測試通過

### 測試架構
```typescript
// 測試範例結構
describe('TemplateManager', () => {
  beforeEach(() => {
    // 測試前置設定
  });

  it('should create new template', () => {
    // 測試邏輯
  });

  it('should categorize templates correctly', () => {
    // 測試邏輯
  });
});
```

### 程式碼風格
- 使用 ESLint + Prettier
- TypeScript 嚴格模式
- 函數命名採用動詞 + 名詞
- 類別命名採用 PascalCase
- 常數採用 SCREAMING_SNAKE_CASE

## 技術棧詳細資訊

### 前端技術
- **Blockly**: Google 開源的視覺化程式設計框架
- **HTML/CSS/JavaScript**: Webview 介面開發
- **TypeScript**: 主要開發語言

### VSCode 整合
- **Extension API**: VSCode 擴展開發接口
- **Webview API**: 內嵌網頁視圖
- **Command API**: 命令註冊與執行
- **FileSystem API**: 檔案系統操作

### 建置工具
- **Webpack**: 模組打包
- **Jest**: 測試框架
- **ESLint**: 程式碼檢查
- **Prettier**: 程式碼格式化

## 參考資源

### 官方文檔
- [VSCode Extension API](https://code.visualstudio.com/api)
- [Google Blockly Documentation](https://developers.google.com/blockly)
- [VSCode Webview Guide](https://code.visualstudio.com/api/extension-guides/webview)

### 參考專案
- [ai-ky blocks](https://ai-ky.github.io/blocks/) - 積木設計參考
- [BlocklyDuino](https://github.com/BlocklyDuino/BlocklyDuino) - Arduino 積木參考
- [VSCode Arduino Extension](https://github.com/microsoft/vscode-arduino) - Arduino 整合參考

### 社群資源
- [VSCode Extension Samples](https://github.com/microsoft/vscode-extension-samples)
- [Blockly Developer Forum](https://groups.google.com/forum/#!forum/blockly)

## 開發環境設定

### 必要工具
- Node.js 18+
- npm/yarn
- Visual Studio Code
- Git

### 安裝步驟
```bash
# 安裝依賴
npm install

# 開發模式
npm run dev

# 執行測試
npm test

# 建置
npm run build

# 打包擴展
vsce package
```

## 品質控制

### 測試策略
- **單元測試**: 個別模組功能測試
- **整合測試**: 模組間互動測試
- **E2E 測試**: 完整使用流程測試
- **效能測試**: 大型專案處理能力測試

### 持續整合
- GitHub Actions 自動測試
- 程式碼覆蓋率報告
- 自動化程式碼檢查
- 預發布驗證流程

### 程式碼審查
- Pull Request 必須經過審查
- 測試覆蓋率要求 >90%
- 程式碼風格檢查
- 效能影響評估

## 部署與發布

### 發布流程
1. 版本號更新
2. 更新日誌撰寫
3. 完整測試執行
4. 擴展打包
5. VSCode Marketplace 發布

### 版本管理
- 採用語義化版本 (Semantic Versioning)
- 主版本.次版本.修訂版本
- 預發布版本標記

## 問題追蹤

### 議題分類
- **Bug**: 功能異常
- **Feature**: 新功能需求
- **Enhancement**: 功能改進
- **Documentation**: 文件相關

### 優先級定義
- **Critical**: 阻塞性問題
- **High**: 重要功能影響
- **Medium**: 一般功能問題
- **Low**: 優化建議

## 團隊協作

### 分支策略
- `main`: 穩定發布分支
- `develop`: 開發整合分支
- `feature/*`: 功能開發分支
- `hotfix/*`: 緊急修復分支

### 提交規範
```
type(scope): description

- feat: 新功能
- fix: 修復
- docs: 文檔
- style: 格式
- refactor: 重構
- test: 測試
- chore: 建置工具
```

## Arduino IDE 相容性支援

### 環境檢測
TextBlockly 支援在 Arduino IDE 環境中運行，透過 VSCode 擴展系統安裝。系統會自動檢測執行環境並調整行為：

#### 檢測機制
- 工作區名稱是否包含 "arduino"
- 工作區資料夾結構分析
- 可見編輯器數量（Arduino IDE 通常只顯示單一編輯器）
- 檔案語言類型和副檔名檢查

#### 檔案關聯策略
1. **優先級順序**:
   - 指定的目標檔案 URI
   - 當前活動編輯器中的 Arduino 檔案
   - 工作區中搜索到的 .ino 檔案
   - 用戶選擇（多檔案情況）
   - 創建新檔案（最後選項）

2. **檔案識別增強**:
   - 支援 `languageId === 'arduino'`
   - 支援檔案副檔名 `.ino`
   - 支援 `languageId === 'cpp'` 且檔名包含 `.ino`

### 視窗管理
#### 統一佈局
- Blockly View: `ViewColumn.Two`（右側）
- Arduino 編輯器: `ViewColumn.One`（左側）

### 清理機制
當關閉 Blockly View 時，系統會：
- 檢測並清理重複的編輯器視窗
- 將多個相同檔案的編輯器合併到單一視窗

### 開發注意事項
- 統一的視窗佈局確保一致的用戶體驗
- 檔案變更監聽器設置適用於各種環境
- 錯誤處理涵蓋不同使用場景

### 測試驗證
測試時，確保：
- 正確識別當前編輯的 .ino 檔案
- 不會創建意外的新檔案
- Blockly View 固定顯示在右側
- Arduino 編輯器固定顯示在左側
- 檔案同步功能正常運作
- 關閉時不會留下重複視窗