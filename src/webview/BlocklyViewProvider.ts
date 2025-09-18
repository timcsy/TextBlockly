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

  public async createOrShow(targetUri?: vscode.Uri): Promise<void> {
    console.log('BlocklyViewProvider: createOrShow called', targetUri?.toString());

    // 先處理 Blockly webview
    // 統一將 Blockly View 放在右側
    const targetColumn = vscode.ViewColumn.Two;

    if (this.panel) {
      console.log('BlocklyViewProvider: Revealing existing panel');
      this.panel.reveal(targetColumn);
    } else {
      console.log('BlocklyViewProvider: Creating new panel');
      this.panel = vscode.window.createWebviewPanel(
        'textblockly',
        'TextBlockly - Visual Programming',
        targetColumn,
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

      this.panel.onDidDispose(async () => {
        console.log('Blockly panel disposed, cleaning up...');

        // 延遲清理以確保 UI 狀態穩定
        setTimeout(async () => {
          await this.cleanupDuplicateEditors();
          this.panel = undefined;
          this.currentArduinoDocument = undefined;
          this.cleanup();
        }, 100);
      });
    }

    // 處理 Arduino 檔案 (左側) - 立即執行以確保檢測到當前檔案
    await this.setupArduinoEditor(targetUri);
  }

  private async setupArduinoEditor(targetUri?: vscode.Uri): Promise<void> {
    try {
      console.log('Setting up Arduino editor', targetUri?.toString());

      // 1. 優先使用指定的檔案
      if (targetUri && targetUri.path.endsWith('.ino')) {
        console.log('Using specified Arduino file:', targetUri.toString());
        try {
          this.currentArduinoDocument = await vscode.workspace.openTextDocument(targetUri);

          // Arduino 編輯器在左側
          await vscode.window.showTextDocument(
            this.currentArduinoDocument,
            {
              viewColumn: vscode.ViewColumn.One,
              preserveFocus: false
            }
          );

          this.setupDocumentChangeListener();
          return;
        } catch (error) {
          console.error('Failed to open specified file:', error);
          vscode.window.showErrorMessage(`無法開啟指定檔案: ${targetUri.fsPath}`);
        }
      }

      // 2. 檢查是否已有開啟的 Arduino 檔案
      const activeEditor = vscode.window.activeTextEditor;
      const allVisibleEditors = vscode.window.visibleTextEditors;

      console.log('=== Arduino File Detection ===');
      console.log('Active editor:', activeEditor?.document.fileName);
      console.log('Active editor language:', activeEditor?.document.languageId);
      console.log('All visible editors:', allVisibleEditors.map(e => ({
        fileName: e.document.fileName,
        languageId: e.document.languageId,
        isUntitled: e.document.isUntitled
      })));

      // 先檢查 activeEditor
      let arduinoEditor = activeEditor;
      let isArduinoFile = activeEditor && (
        activeEditor.document.languageId === 'arduino' ||
        activeEditor.document.fileName.endsWith('.ino') ||
        (activeEditor.document.languageId === 'cpp' && activeEditor.document.fileName.includes('.ino'))
      );

      // 如果 activeEditor 不是 Arduino 檔案，檢查所有可見的編輯器
      if (!isArduinoFile) {
        console.log('Active editor is not Arduino file, checking all visible editors...');
        arduinoEditor = allVisibleEditors.find(editor =>
          editor.document.languageId === 'arduino' ||
          editor.document.fileName.endsWith('.ino') ||
          (editor.document.languageId === 'cpp' && editor.document.fileName.includes('.ino'))
        );
        isArduinoFile = !!arduinoEditor;
      }

      if (isArduinoFile && arduinoEditor) {
        console.log('✅ Found existing Arduino file, using it:', arduinoEditor.document.fileName);
        // 使用現有的 Arduino 檔案
        this.currentArduinoDocument = arduinoEditor.document;

        // Arduino 編輯器移動到左側
        await vscode.window.showTextDocument(
          this.currentArduinoDocument,
          {
            viewColumn: vscode.ViewColumn.One,
            preserveFocus: false
          }
        );

        // 設置文檔變更監聽器
        this.setupDocumentChangeListener();

        console.log('✅ Using existing Arduino file successfully');
        return;
      } else {
        console.log('❌ No Arduino file found in active or visible editors');
      }

      // 3. 在工作區中搜索 Arduino 檔案
      const workspaceFiles = await vscode.workspace.findFiles('**/*.ino', '**/node_modules/**', 10);
      if (workspaceFiles.length > 0) {
        console.log('Found Arduino files in workspace:', workspaceFiles.map(f => f.toString()));

        // 如果只有一個檔案，直接使用它
        if (workspaceFiles.length === 1) {
          console.log('Using single Arduino file found in workspace');
          this.currentArduinoDocument = await vscode.workspace.openTextDocument(workspaceFiles[0]);

          // Arduino 編輯器在左側
          await vscode.window.showTextDocument(
            this.currentArduinoDocument,
            {
              viewColumn: vscode.ViewColumn.One,
              preserveFocus: false
            }
          );

          this.setupDocumentChangeListener();
          return;
        }

        // 如果有多個檔案，讓用戶選擇
        const fileItems = workspaceFiles.map(file => ({
          label: vscode.workspace.asRelativePath(file),
          description: file.fsPath,
          uri: file
        }));

        const selected = await vscode.window.showQuickPick(fileItems, {
          placeHolder: '選擇要編輯的 Arduino 檔案'
        });

        if (selected) {
          console.log('User selected Arduino file:', selected.uri.toString());
          this.currentArduinoDocument = await vscode.workspace.openTextDocument(selected.uri);

          // Arduino 編輯器在左側
          await vscode.window.showTextDocument(
            this.currentArduinoDocument,
            {
              viewColumn: vscode.ViewColumn.One,
              preserveFocus: false
            }
          );

          this.setupDocumentChangeListener();
          return;
        }
      }

      // 4. 最後選項：創建新的 Arduino 檔案
      console.log('Creating new Arduino editor');
      // 確保先有 Blockly View，再創建 Arduino 編輯器
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

    // Arduino 編輯器在左側，但要確保與 Blockly View 分開
    console.log('Opening document in left column');

    // 檢查當前的編輯器狀態，決定如何佈局
    const visibleEditors = vscode.window.visibleTextEditors;
    console.log('Current visible editors:', visibleEditors.length);

    // 如果已經有 Blockly View 在右側，Arduino 檔案放左側
    // 如果沒有其他編輯器，先確保能分開顯示
    const targetColumn = visibleEditors.length === 0 ? vscode.ViewColumn.One : vscode.ViewColumn.One;

    await vscode.window.showTextDocument(
      this.currentArduinoDocument,
      {
        viewColumn: targetColumn,
        preserveFocus: false
      }
    );

    // 短暫延遲後，確保 Blockly View 在右側
    setTimeout(() => {
      if (this.panel) {
        this.panel.reveal(vscode.ViewColumn.Two);
      }
    }, 200);

    console.log('Arduino document created and shown');

    // 設置文檔變更監聽器
    this.setupDocumentChangeListener();

    // 初始同步將在 blocklyReady 事件中自動執行

    vscode.window.showInformationMessage('已創建新的 Arduino 檔案在左側編輯器');
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

      // 寬鬆檢查：如果沒有 setup/loop 函數，給予提示但仍然嘗試同步
      if (!this.codeParser.isValidArduinoCode(code)) {
        console.log('Code does not have standard Arduino structure, but attempting sync anyway');
        console.log('Code preview:', code.substring(0, 200));
        if (code.trim().length > 0) {
          vscode.window.showInformationMessage('程式碼將同步到積木，但建議包含 void setup() 和 void loop() 函數');
        }
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

  /**
   * 檢測是否在 Arduino IDE 環境中運行
   */
  private detectArduinoIDEEnvironment(): boolean {
    try {
      // 檢查環境變數或其他 Arduino IDE 特徵
      const workspaceName = vscode.workspace.name;
      const workspaceFolders = vscode.workspace.workspaceFolders;

      // Arduino IDE 可能會有特定的工作區設定
      console.log('Workspace name:', workspaceName);
      console.log('Workspace folders:', workspaceFolders?.map(f => f.name));

      // 檢查是否有 Arduino IDE 的特徵：
      // 1. 工作區名稱可能包含 arduino
      // 2. 檔案結構可能不同
      // 3. VSCode 視窗配置可能不同

      const hasArduinoFeatures = (
        workspaceName?.toLowerCase().includes('arduino') ||
        workspaceFolders?.some(f => f.name.toLowerCase().includes('arduino')) ||
        vscode.window.visibleTextEditors.length <= 1 // Arduino IDE 通常只顯示一個編輯器
      );

      console.log('Arduino IDE environment detected:', hasArduinoFeatures);
      return hasArduinoFeatures;
    } catch (error) {
      console.error('Error detecting Arduino IDE environment:', error);
      return false;
    }
  }

  /**
   * 清理重複的 Arduino 編輯器視窗
   */
  private async cleanupDuplicateEditors(): Promise<void> {
    try {
      if (!this.currentArduinoDocument) {
        return;
      }

      console.log('Cleaning up duplicate Arduino editors');

      // 找到所有顯示相同 Arduino 檔案的編輯器
      const duplicateEditors = vscode.window.visibleTextEditors.filter(
        (editor) => editor.document === this.currentArduinoDocument
      );

      console.log(`Found ${duplicateEditors.length} editors for the same Arduino file`);

      // 如果有多個編輯器顯示同一個檔案，保留第一個並關閉其他的
      if (duplicateEditors.length > 1) {
        console.log('Multiple editors found, consolidating to Column One');

        // 保留第一個編輯器並移到 Column One
        const primaryEditor = duplicateEditors[0];
        await vscode.window.showTextDocument(
          primaryEditor.document,
          {
            viewColumn: vscode.ViewColumn.One,
            preserveFocus: false,
            preview: false
          }
        );

        console.log('Primary editor moved to Column One');
      }
    } catch (error) {
      console.error('清理重複編輯器時發生錯誤:', error);
      // 不顯示錯誤訊息給用戶，因為這是內部清理操作
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
        // Arduino 編輯器在左側
        const showTextResult = await vscode.window.showTextDocument(
          this.currentArduinoDocument!,
          {
            viewColumn: vscode.ViewColumn.One,
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
        console.log('Blockly is ready - starting auto sync from code to blocks');
        try {
          if (this.currentArduinoDocument) {
            const code = this.currentArduinoDocument.getText();
            console.log('Auto-syncing code to blocks on startup:', code.length, 'characters');
            console.log('Code preview:', code.substring(0, 200) + '...');

            // 自動同步程式碼到積木
            await this.syncCodeToBlocks(code, true);
            vscode.window.showInformationMessage('Blockly 已就緒，程式碼已自動同步到積木');
          } else {
            console.log('No Arduino document available for auto sync');
            vscode.window.showInformationMessage('Blockly 已就緒');
          }
        } catch (error) {
          console.error('Auto sync on startup failed:', error);
          vscode.window.showInformationMessage('Blockly 已就緒，但自動同步失敗');
        }
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
