import * as vscode from 'vscode';

export class CodeSyncManager {
  private currentDocument: vscode.TextDocument | undefined;
  private isUpdating: boolean = false;

  public syncCodeToBlocks(): void {
    if (this.isUpdating) {
      return;
    }

    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor || activeEditor.document.languageId !== 'arduino') {
      vscode.window.showWarningMessage('請先開啟一個 Arduino (.ino) 檔案');
      return;
    }

    this.currentDocument = activeEditor.document;
    const code = this.currentDocument.getText();

    // 暫時顯示提示訊息，將來實作程式碼解析
    vscode.window.showInformationMessage('程式碼到積木同步功能正在開發中');
    console.log('同步程式碼到積木:', code);
  }

  public async syncBlocksToCode(generatedCode?: string): Promise<void> {
    if (this.isUpdating) {
      return;
    }

    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor || activeEditor.document.languageId !== 'arduino') {
      // 如果沒有開啟的 Arduino 檔案，創建一個新的
      await this.createNewArduinoFile(generatedCode);
      return;
    }

    await this.updateActiveEditor(activeEditor, generatedCode);
  }

  /**
   * 智能同步：只在有開啟的 Arduino 檔案時更新，否則靜默忽略
   */
  public async smartSyncBlocksToCode(generatedCode?: string): Promise<void> {
    if (this.isUpdating) {
      return;
    }

    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor || activeEditor.document.languageId !== 'arduino') {
      // 沒有開啟的 Arduino 檔案時，靜默忽略
      return;
    }

    await this.updateActiveEditor(activeEditor, generatedCode);
  }

  /**
   * 更新活動編輯器的內容
   */
  private async updateActiveEditor(
    activeEditor: vscode.TextEditor,
    generatedCode?: string
  ): Promise<void> {
    if (!generatedCode) {
      vscode.window.showWarningMessage('沒有程式碼可以同步');
      return;
    }

    try {
      this.isUpdating = true;

      // 替換整個文檔內容
      const fullRange = new vscode.Range(
        activeEditor.document.positionAt(0),
        activeEditor.document.positionAt(activeEditor.document.getText().length)
      );

      await activeEditor.edit((editBuilder) => {
        editBuilder.replace(fullRange, generatedCode);
      });

      vscode.window.showInformationMessage('程式碼已同步到編輯器');
    } catch (error) {
      vscode.window.showErrorMessage(
        `同步程式碼失敗: ${(error as Error).message}`
      );
    } finally {
      this.isUpdating = false;
    }
  }

  public onDocumentChange(event: vscode.TextDocumentChangeEvent): void {
    if (this.isUpdating) {
      return;
    }

    // 當文檔變更時，可以觸發自動同步到積木
    // 暫時只記錄變更
    console.log('文檔變更:', event.document.fileName);
  }

  public onBlocksChanged(blockData: any): void {
    // 當積木工作區變更時的處理
    console.log('積木工作區變更:', blockData);
  }

  private async createNewArduinoFile(code?: string): Promise<void> {
    try {
      const defaultCode =
        code ||
        `// Arduino 程式碼
// 由 TextBlockly 生成

void setup() {
  // 初始化程式碼
}

void loop() {
  // 主要程式邏輯
}`;

      const document = await vscode.workspace.openTextDocument({
        content: defaultCode,
        language: 'arduino',
      });

      await vscode.window.showTextDocument(document);
      vscode.window.showInformationMessage('已創建新的 Arduino 檔案');
    } catch (error) {
      vscode.window.showErrorMessage(
        `創建新檔案失敗: ${(error as Error).message}`
      );
    }
  }

  /**
   * 設置當前活動文檔
   */
  public setCurrentDocument(document: vscode.TextDocument): void {
    this.currentDocument = document;
  }

  /**
   * 獲取當前活動文檔
   */
  public getCurrentDocument(): vscode.TextDocument | undefined {
    return this.currentDocument;
  }

  /**
   * 檢查是否正在更新
   */
  public isCurrentlyUpdating(): boolean {
    return this.isUpdating;
  }

  /**
   * 強制同步模式開關
   */
  public setUpdatingState(state: boolean): void {
    this.isUpdating = state;
  }

  /**
   * 解析 Arduino 程式碼到積木結構（未來實作）
   */
  private parseArduinoCode(_code: string): any {
    // 這裡將實作程式碼解析邏輯
    // 暫時返回空物件
    return {};
  }

  /**
   * 檢查程式碼是否包含 Arduino 結構
   */
  private isValidArduinoCode(code: string): boolean {
    return code.includes('void setup()') && code.includes('void loop()');
  }

  /**
   * 獲取程式碼統計資訊
   */
  public getCodeStats(code: string): {
    lines: number;
    functions: number;
    blocks: number;
  } {
    const lines = code.split('\n').length;
    const functions = (code.match(/void\s+\w+\s*\(/g) || []).length;
    const blocks = (code.match(/\{/g) || []).length;

    return { lines, functions, blocks };
  }

  /**
   * 驗證 Arduino 程式碼語法（簡單檢查）
   */
  public validateArduinoCode(code: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!code.includes('void setup()')) {
      errors.push('缺少 setup() 函數');
    }

    if (!code.includes('void loop()')) {
      errors.push('缺少 loop() 函數');
    }

    // 檢查括號平衡
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push('括號不平衡');
    }

    // 檢查分號
    const statements = code.split('\n').filter((line) => {
      const trimmed = line.trim();
      return (
        trimmed.length > 0 &&
        !trimmed.startsWith('//') &&
        !trimmed.startsWith('/*') &&
        !trimmed.includes('{') &&
        !trimmed.includes('}') &&
        !trimmed.startsWith('#')
      );
    });

    statements.forEach((stmt, index) => {
      if (
        !stmt.trim().endsWith(';') &&
        !stmt.trim().endsWith('{') &&
        !stmt.trim().endsWith('}')
      ) {
        errors.push(`第 ${index + 1} 行可能缺少分號`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
