# TextBlockly

Arduino 視覺化程式設計的 VSCode 擴展，結合 Blockly 積木式程式設計與傳統程式碼編輯器的雙向同步功能。

## 功能特色

- 🎯 **視覺化積木編程**: 使用拖拉放置的方式建立 Arduino 程式
- 🔄 **雙向程式碼同步**: 積木與程式碼即時同步，無縫切換
- 📚 **積木模板管理**: 完整的分類管理系統，支援模板匯入/匯出
- 🎓 **教學友善**: 專為程式設計教育設計的介面
- ⚡ **即時預覽**: 即時生成 Arduino C++ 程式碼

## 安裝需求

- Visual Studio Code 1.74.0 或更高版本
- Node.js 18.x 或更高版本

## 開始使用

### 安裝擴展

1. 在 VSCode 中開啟擴展市場
2. 搜尋 "TextBlockly"
3. 點擊安裝

### 基本使用

1. 開啟或建立 `.ino` Arduino 檔案
2. 按 `Ctrl+Shift+P` 開啟命令面板
3. 執行 `TextBlockly: Open Blockly View` 命令
4. 開始使用積木進行視覺化程式設計！

## 主要命令

| 命令 | 說明 |
|------|------|
| `TextBlockly: Open Blockly View` | 開啟積木視覺化編輯器 |
| `TextBlockly: Sync Code to Blocks` | 將程式碼同步到積木 |
| `TextBlockly: Sync Blocks to Code` | 將積木同步到程式碼 |
| `TextBlockly: Open Template Manager` | 開啟模板管理器 |

## 開發設置

### 環境需求

- Node.js 18+
- npm 或 yarn
- Visual Studio Code

### 安裝依賴

```bash
npm install
```

### 開發命令

```bash
# 開發模式（監聽變更）
npm run watch

# 執行測試
npm test

# 測試覆蓋率
npm run test:coverage

# 程式碼檢查
npm run lint

# 修復程式碼風格
npm run lint:fix

# 建置擴展
npm run compile

# 打包擴展
npm run package
```

### 測試驅動開發

專案採用 TDD（測試驅動開發）方式：

1. 先寫測試案例
2. 執行測試（應該失敗）
3. 寫最少的程式碼讓測試通過
4. 重構程式碼
5. 重複流程

```bash
# 持續執行測試
npm run test:watch
```

## 專案結構

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
├── PRD.md                 # 產品需求文件
├── AGENTS.md              # 開發資訊文件
└── package.json           # 專案配置
```

## 積木分類

### 基礎分類
- 數位 I/O 控制
- 類比訊號處理
- 感測器讀取
- 控制流程（if/else/loop）

### 進階分類
- 通訊協議（UART/I2C/SPI）
- 馬達控制
- 顯示器操作
- 音效控制

### 專案分類
- 物聯網應用
- 機器人控制
- 環境監測
- 智慧家居

## 貢獻指南

我們歡迎任何形式的貢獻！

### 回報問題

在 [GitHub Issues](https://github.com/textblockly/textblockly/issues) 回報問題時，請提供：

- 問題描述
- 重現步驟
- 預期行為
- 實際行為
- 系統環境資訊

### 提交程式碼

1. Fork 此專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

### 程式碼規範

- 遵循 ESLint 設定
- 維持 90% 以上測試覆蓋率
- 所有 PR 必須通過 CI 檢查
- 使用 TDD 開發方式

## 授權條款

本專案使用 [MIT License](LICENSE) 授權。

## 致謝

- [Google Blockly](https://developers.google.com/blockly) - 視覺化程式設計框架
- [VSCode Extension API](https://code.visualstudio.com/api) - 擴展開發接口
- [ai-ky blocks](https://ai-ky.github.io/blocks/) - 積木設計參考

## 聯絡方式

- 專案首頁: [TextBlockly](https://github.com/textblockly/textblockly)
- 問題回報: [GitHub Issues](https://github.com/textblockly/textblockly/issues)
- 社群討論: [GitHub Discussions](https://github.com/textblockly/textblockly/discussions)

---

**讓 Arduino 程式設計變得更加直觀和有趣！** 🚀