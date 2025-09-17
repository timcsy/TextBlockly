import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { TemplateManager } from '../template/TemplateManager';
import { CodeSyncManager } from '../sync/CodeSyncManager';
import { ArduinoBlocks } from '../blockly/ArduinoBlocks';
import { ArduinoCodeGenerator } from '../arduino/CodeGenerator';
import { ArduinoCodeParser } from '../arduino/CodeParser';

export class BlocklyViewProvider {
  private panel: vscode.WebviewPanel | undefined;
  private codeGenerator: ArduinoCodeGenerator;
  private codeParser: ArduinoCodeParser;
  private currentArduinoDocument: vscode.TextDocument | undefined;
  private documentChangeListener: vscode.Disposable | undefined;
  private lastGeneratedCode: string = '';
  private syncInProgress: boolean = false;

  constructor(
    private context: vscode.ExtensionContext,
    private templateManager: TemplateManager,
    private codeSyncManager: CodeSyncManager
  ) {
    this.codeGenerator = new ArduinoCodeGenerator();
    this.codeParser = new ArduinoCodeParser();
  }

  public async createOrShow(): Promise<void> {
    console.log('BlocklyViewProvider: createOrShow called');

    // 先處理 Blockly webview (左側)
    if (this.panel) {
      console.log('BlocklyViewProvider: Revealing existing panel');
      this.panel.reveal(vscode.ViewColumn.One);
    } else {
      console.log('BlocklyViewProvider: Creating new panel');
      this.panel = vscode.window.createWebviewPanel(
        'textblockly',
        'TextBlockly - Visual Programming',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          enableForms: true,
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
        this.currentArduinoDocument = undefined;
        this.cleanup();
      });
    }

    // 處理 Arduino 檔案 (右側)
    await this.setupArduinoEditor();
  }

  private async setupArduinoEditor(): Promise<void> {
    try {
      console.log('Setting up Arduino editor');

      // 檢查是否已有開啟的 Arduino 檔案
      const activeEditor = vscode.window.activeTextEditor;
      console.log('Active editor language:', activeEditor?.document.languageId);

      if (activeEditor && activeEditor.document.languageId === 'arduino') {
        console.log('Found existing Arduino file, moving to right side');
        // 使用現有的 Arduino 檔案並移到右側
        this.currentArduinoDocument = activeEditor.document;
        await vscode.window.showTextDocument(
          this.currentArduinoDocument,
          {
            viewColumn: vscode.ViewColumn.Two,
            preserveFocus: false
          }
        );

        // 設置文檔變更監聽器
        this.setupDocumentChangeListener();

        // 延遲初始同步將在 blocklyReady 事件中處理

        return;
      }

      // 創建新的 Arduino 檔案
      console.log('Creating new Arduino editor');
      await this.createNewArduinoEditor();
    } catch (error) {
      console.error('設置 Arduino 編輯器失敗:', error);
      vscode.window.showErrorMessage(
        `設置 Arduino 編輯器失敗: ${(error as Error).message}`
      );
    }
  }

  private async createNewArduinoEditor(): Promise<void> {
    const defaultCode = `// Arduino 程式碼
// 由 TextBlockly 生成

void setup() {
  // 初始化程式碼
}

void loop() {
  // 主要程式邏輯
}`;

    console.log('Creating new document with arduino language');
    this.currentArduinoDocument = await vscode.workspace.openTextDocument({
      content: defaultCode,
      language: 'arduino',
    });

    console.log('Opening document in column two');
    await vscode.window.showTextDocument(
      this.currentArduinoDocument,
      {
        viewColumn: vscode.ViewColumn.Two,
        preserveFocus: false
      }
    );

    console.log('Arduino document created and shown');

    // 設置文檔變更監聽器
    this.setupDocumentChangeListener();

    // 延遲初始同步將在 blocklyReady 事件中處理

    vscode.window.showInformationMessage('已創建新的 Arduino 檔案在右側編輯器');
  }

  /**
   * 設置文檔變更監聽器以實現雙向同步
   */
  private setupDocumentChangeListener(): void {
    if (this.documentChangeListener) {
      this.documentChangeListener.dispose();
    }

    if (!this.currentArduinoDocument) {
      return;
    }

    console.log('Setting up document change listener');

    this.documentChangeListener = vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document === this.currentArduinoDocument && !this.syncInProgress) {
        console.log('Arduino document changed - manual sync mode, auto sync disabled');
        // 手動同步模式 - 不自動同步到積木
      }
    });
  }

  /**
   * 將程式碼同步到積木
   */
  private async syncCodeToBlocks(code: string, forceSync: boolean = false): Promise<void> {
    try {
      console.log('=== Starting syncCodeToBlocks ===');
      console.log('Code to sync:', code.substring(0, 300) + '...');
      console.log('Force sync:', forceSync);

      // 防止無限循環（除非強制同步）
      if (!forceSync && this.codeParser.codeEquals(code, this.lastGeneratedCode)) {
        console.log('Code is same as last generated, skipping sync');
        return;
      }

      console.log('Syncing code to blocks');

      if (!this.codeParser.isValidArduinoCode(code)) {
        console.log('Invalid Arduino code, skipping sync');
        console.log('Code validity check failed for:', code.substring(0, 200));
        vscode.window.showWarningMessage('Arduino 程式碼格式無效，請確保包含 void setup() 和 void loop() 函數');
        return;
      }

      console.log('Code is valid Arduino code');
      const parsedWorkspace = this.codeParser.parseCode(code);
      console.log('Parsed workspace:', JSON.stringify(parsedWorkspace, null, 2));

      const xml = this.codeParser.blocksToXml(parsedWorkspace);
      console.log('Generated XML length:', xml.length);
      console.log('Generated XML preview:', xml.substring(0, 500) + '...');

      // 發送到 webview
      if (this.panel?.webview) {
        console.log('Sending loadWorkspace message to webview');
        this.panel.webview.postMessage({
          command: 'loadWorkspace',
          data: { xml }
        });
        console.log('loadWorkspace message sent successfully');
      } else {
        console.log('ERROR: No webview panel available');
        throw new Error('Webview panel not available');
      }

    } catch (error) {
      console.error('同步程式碼到積木失敗:', error);
      vscode.window.showErrorMessage(`同步失敗: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * 清理資源
   */
  private cleanup(): void {
    if (this.documentChangeListener) {
      this.documentChangeListener.dispose();
      this.documentChangeListener = undefined;
    }
  }

  private async updateArduinoEditor(code: string): Promise<void> {
    try {
      console.log('updateArduinoEditor called with code length:', code.length);
      console.log('Code preview:', code.substring(0, 200) + '...');

      // 設置同步標志防止循環
      this.syncInProgress = true;

      if (!this.currentArduinoDocument) {
        console.log('No current Arduino document, creating new one');
        await this.createNewArduinoEditor();
      }

      if (!this.currentArduinoDocument) {
        throw new Error('Failed to create Arduino document');
      }

      // 找到對應的編輯器
      const editor = vscode.window.visibleTextEditors.find(
        (editor) => editor.document === this.currentArduinoDocument
      );

      console.log('Found editor:', !!editor);
      console.log('Visible editors count:', vscode.window.visibleTextEditors.length);
      console.log('Current Arduino document URI:', this.currentArduinoDocument?.uri.toString());
      console.log('All visible editor URIs:', vscode.window.visibleTextEditors.map(e => e.document.uri.toString()));
      console.log('All visible editor languages:', vscode.window.visibleTextEditors.map(e => e.document.languageId));

      if (!editor) {
        console.log('Editor not visible, reopening document');
        // 如果編輯器不可見，重新開啟
        const showTextResult = await vscode.window.showTextDocument(
          this.currentArduinoDocument!,
          {
            viewColumn: vscode.ViewColumn.Two,
            preserveFocus: false,
            preview: false
          }
        );
        console.log('showTextDocument result:', showTextResult.document.uri.toString());

        // 等待一下讓編輯器完全載入
        await new Promise(resolve => setTimeout(resolve, 200));

        // 重新找到編輯器
        const newEditor = vscode.window.visibleTextEditors.find(
          (editor) => editor.document === this.currentArduinoDocument
        );
        if (newEditor) {
          console.log('Found new editor after reopening, updating content');
          await this.replaceEditorContent(newEditor, code);
          console.log('Content updated successfully');
        } else {
          console.log('Still no editor found after reopening');
          // 強制更新內容
          await this.forceUpdateContent(code);
        }
      } else {
        console.log('Updating existing editor');
        await this.replaceEditorContent(editor, code);
        console.log('Existing editor content updated successfully');
      }
    } catch (error) {
      console.error('更新 Arduino 編輯器失敗:', error);
      vscode.window.showErrorMessage(`同步失敗: ${(error as Error).message}`);
    } finally {
      // 重置同步標志並設置最後生成的程式碼
      setTimeout(() => {
        this.syncInProgress = false;
        this.lastGeneratedCode = code;
      }, 100);
    }
  }

  private async replaceEditorContent(
    editor: vscode.TextEditor,
    code: string
  ): Promise<void> {
    const document = editor.document;
    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(document.getText().length)
    );

    await editor.edit((editBuilder) => {
      editBuilder.replace(fullRange, code);
    });
  }

  private async forceUpdateContent(code: string): Promise<void> {
    try {
      console.log('Force updating content using WorkspaceEdit');

      const workspaceEdit = new vscode.WorkspaceEdit();
      const fullRange = new vscode.Range(
        this.currentArduinoDocument!.positionAt(0),
        this.currentArduinoDocument!.positionAt(this.currentArduinoDocument!.getText().length)
      );

      workspaceEdit.replace(this.currentArduinoDocument!.uri, fullRange, code);
      await vscode.workspace.applyEdit(workspaceEdit);

      console.log('Force update completed');
    } catch (error) {
      console.error('Force update failed:', error);
      throw error;
    }
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
    console.log('Received message:', message.command);

    switch (message.command) {
      case 'workspaceChanged':
        await this.handleWorkspaceChanged(message.data);
        break;

      case 'codeGenerated':
        await this.handleCodeGenerated(message.data);
        break;

      case 'smartSyncCode':
        console.log('Handling smartSyncCode message');
        await this.updateArduinoEditor(message.data.code);
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

      case 'syncCodeToEditor':
        await this.codeSyncManager.syncBlocksToCode(message.data.code);
        vscode.window.showInformationMessage('程式碼已同步到編輯器');
        break;

      case 'blocklyReady':
        console.log('Blockly is ready in manual sync mode');
        // 手動同步模式 - 不執行自動初始同步
        vscode.window.showInformationMessage('Blockly 已就緒，使用工具列按鈕進行手動同步');
        break;

      case 'manualSyncToCode':
        console.log('Handling manual sync to code');
        console.log('Code to sync:', message.data.code.substring(0, 200) + '...');
        console.log('Current Arduino document exists:', !!this.currentArduinoDocument);

        try {
          await this.updateArduinoEditor(message.data.code);
          vscode.window.showInformationMessage('積木已同步到程式碼');
        } catch (error) {
          console.error('Error in manual sync to code:', error);
          vscode.window.showErrorMessage(`同步失敗: ${(error as Error).message}`);
        }
        break;

      case 'manualSyncToBlocks':
        console.log('Handling manual sync to blocks');
        try {
          if (this.currentArduinoDocument) {
            const code = this.currentArduinoDocument.getText();
            console.log('Current Arduino code length:', code.length);
            console.log('Code preview:', code.substring(0, 200) + '...');

            await this.syncCodeToBlocks(code, true);
            vscode.window.showInformationMessage('程式碼已同步到積木');
          } else {
            vscode.window.showWarningMessage('沒有開啟的 Arduino 檔案');
          }
        } catch (error) {
          console.error('Error in manual sync to blocks:', error);
          vscode.window.showErrorMessage(`同步失敗: ${(error as Error).message}`);
        }
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
    // 只是接收程式碼生成事件，不自動同步到檔案
    // 程式碼已經在 webview 中顯示，用戶需要主動按「執行」才會同步到檔案
    console.log('Code generated:', data.code.substring(0, 100) + '...');
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
      // 首先請求 webview 提供當前的程式碼
      this.panel?.webview.postMessage({
        command: 'requestCurrentCode',
      });

      // 註：實際的同步會在 webview 回應時處理
    } catch (error) {
      vscode.window.showErrorMessage(`執行失敗: ${(error as Error).message}`);
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
