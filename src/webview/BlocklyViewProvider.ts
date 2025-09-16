import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { TemplateManager } from '../template/TemplateManager';
import { CodeSyncManager } from '../sync/CodeSyncManager';
import { ArduinoBlocks } from '../blockly/ArduinoBlocks';
import { ArduinoCodeGenerator } from '../arduino/CodeGenerator';

export class BlocklyViewProvider {
  private panel: vscode.WebviewPanel | undefined;
  private codeGenerator: ArduinoCodeGenerator;

  constructor(
    private context: vscode.ExtensionContext,
    private templateManager: TemplateManager,
    private codeSyncManager: CodeSyncManager
  ) {
    this.codeGenerator = new ArduinoCodeGenerator();
  }

  public createOrShow(): void {
    const columnToShowIn = vscode.ViewColumn.Two;

    if (this.panel) {
      this.panel.reveal(columnToShowIn);
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'textblockly',
      'TextBlockly - Visual Programming',
      columnToShowIn,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(
            this.context.extensionUri,
            'node_modules',
            'blockly'
          ),
          vscode.Uri.joinPath(this.context.extensionUri, 'resources'),
        ],
      }
    );

    this.panel.webview.html = this.getWebviewContent();
    this.setupMessageHandling();

    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });
  }

  private getWebviewContent(): string {
    try {
      // 讀取 HTML 模板
      const htmlTemplatePath = path.join(
        this.context.extensionPath,
        'src',
        'webview',
        'blockly.html'
      );
      let htmlContent = fs.readFileSync(htmlTemplatePath, 'utf8');

      // 獲取 Blockly 資源路徑
      const blocklyPath = this.panel!.webview.asWebviewUri(
        vscode.Uri.joinPath(
          this.context.extensionUri,
          'node_modules',
          'blockly'
        )
      );

      // 替換模板變數
      htmlContent = htmlContent
        .replace(/{{BLOCKLY_PATH}}/g, blocklyPath.toString())
        .replace(
          /{{ARDUINO_BLOCKS}}/g,
          JSON.stringify(ArduinoBlocks.getAllBlocks())
        )
        .replace(
          /{{TOOLBOX}}/g,
          JSON.stringify(ArduinoBlocks.getToolboxCategories())
        );

      return htmlContent;
    } catch (error) {
      console.error('生成 webview 內容時發生錯誤:', error);
      return this.getErrorContent(error as Error);
    }
  }

  private getErrorContent(error: Error): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <title>TextBlockly 錯誤</title>
          <style>
              body {
                  font-family: 'Segoe UI', sans-serif;
                  padding: 20px;
                  background-color: var(--vscode-editor-background);
                  color: var(--vscode-editor-foreground);
              }
              .error {
                  background-color: var(--vscode-inputValidation-errorBackground);
                  border: 1px solid var(--vscode-inputValidation-errorBorder);
                  padding: 16px;
                  border-radius: 4px;
                  margin: 16px 0;
              }
              .retry-btn {
                  background-color: var(--vscode-button-background);
                  color: var(--vscode-button-foreground);
                  border: none;
                  padding: 8px 16px;
                  border-radius: 4px;
                  cursor: pointer;
                  margin-top: 12px;
              }
          </style>
      </head>
      <body>
          <h1>TextBlockly 初始化失敗</h1>
          <div class="error">
              <h3>錯誤詳情:</h3>
              <p>${error.message}</p>
              <pre>${error.stack}</pre>
          </div>
          <button class="retry-btn" onclick="location.reload()">重試</button>
          <p>如果問題持續存在，請檢查:</p>
          <ul>
              <li>確保 Blockly 依賴已正確安裝</li>
              <li>檢查擴展權限設定</li>
              <li>查看 VSCode 開發者主控台以獲取更多資訊</li>
          </ul>
      </body>
      </html>
    `;
  }

  private setupMessageHandling(): void {
    if (!this.panel) {
      return;
    }

    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        try {
          await this.handleMessage(message);
        } catch (error) {
          console.error('處理 webview 訊息時發生錯誤:', error);
          vscode.window.showErrorMessage(
            `處理操作時發生錯誤: ${(error as Error).message}`
          );
        }
      },
      undefined,
      this.context.subscriptions
    );
  }

  private async handleMessage(message: any): Promise<void> {
    switch (message.command) {
      case 'workspaceChanged':
        await this.handleWorkspaceChanged(message.data);
        break;

      case 'codeGenerated':
        await this.handleCodeGenerated(message.data);
        break;

      case 'saveTemplate':
        await this.handleSaveTemplate(message.data);
        break;

      case 'loadTemplate':
        await this.handleLoadTemplate();
        break;

      case 'runCode':
        await this.handleRunCode();
        break;

      default:
        console.warn('未知的 webview 命令:', message.command);
    }
  }

  private async handleWorkspaceChanged(data: any): Promise<void> {
    // 通知同步管理器工作區已變更
    this.codeSyncManager.onBlocksChanged(data);
  }

  private async handleCodeGenerated(data: { code: string }): Promise<void> {
    // 同步生成的程式碼到編輯器
    await this.codeSyncManager.syncBlocksToCode(data.code);
  }

  private async handleSaveTemplate(data: { xml: string }): Promise<void> {
    try {
      const templateName = await vscode.window.showInputBox({
        prompt: '請輸入模板名稱',
        placeHolder: '例如: LED 閃爍範例',
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return '模板名稱不能為空';
          }
          return null;
        },
      });

      if (!templateName) {
        return;
      }

      await this.templateManager.saveTemplate({
        name: templateName,
        xml: data.xml,
        category: 'custom',
        description: '',
        tags: [],
      });

      vscode.window.showInformationMessage(`模板 "${templateName}" 已儲存`);
    } catch (error) {
      vscode.window.showErrorMessage(
        `儲存模板失敗: ${(error as Error).message}`
      );
    }
  }

  private async handleLoadTemplate(): Promise<void> {
    try {
      const templates = await this.templateManager.getTemplates();

      if (templates.length === 0) {
        vscode.window.showInformationMessage('沒有可用的模板');
        return;
      }

      const templateItems = templates.map((template) => ({
        label: template.name,
        description: template.description,
        detail: `分類: ${template.category}`,
        template,
      }));

      const selected = await vscode.window.showQuickPick(templateItems, {
        placeHolder: '選擇要載入的模板',
      });

      if (!selected) {
        return;
      }

      // 傳送模板資料到 webview
      this.panel?.webview.postMessage({
        command: 'loadWorkspace',
        data: { xml: selected.template.xml },
      });

      vscode.window.showInformationMessage(
        `已載入模板 "${selected.template.name}"`
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `載入模板失敗: ${(error as Error).message}`
      );
    }
  }

  private async handleRunCode(): Promise<void> {
    try {
      // 觸發程式碼同步
      this.panel?.webview.postMessage({
        command: 'syncCode',
      });

      vscode.window.showInformationMessage('程式碼已同步到編輯器');
    } catch (error) {
      vscode.window.showErrorMessage(`執行失敗: ${(error as Error).message}`);
    }
  }

  /**
   * 從外部同步程式碼到積木
   */
  public async syncCodeToBlocks(_code: string): Promise<void> {
    try {
      // 這裡將實作程式碼解析邏輯
      // 暫時顯示提示訊息
      vscode.window.showInformationMessage('程式碼到積木的同步功能正在開發中');
    } catch (error) {
      vscode.window.showErrorMessage(
        `同步程式碼到積木失敗: ${(error as Error).message}`
      );
    }
  }

  /**
   * 載入工作區
   */
  public loadWorkspace(xml: string): void {
    this.panel?.webview.postMessage({
      command: 'loadWorkspace',
      data: { xml },
    });
  }

  /**
   * 清空工作區
   */
  public clearWorkspace(): void {
    this.panel?.webview.postMessage({
      command: 'clearWorkspace',
    });
  }

  /**
   * 獲取當前工作區狀態
   */
  public getCurrentWorkspace(): Promise<string> {
    return new Promise((resolve) => {
      // 實作獲取工作區狀態的邏輯
      // 暫時返回空字符串
      resolve('');
    });
  }

  /**
   * 檢查面板是否已創建並可見
   */
  public isVisible(): boolean {
    return this.panel !== undefined && this.panel.visible;
  }

  /**
   * 銷毀面板
   */
  public dispose(): void {
    this.panel?.dispose();
    this.panel = undefined;
  }
}
