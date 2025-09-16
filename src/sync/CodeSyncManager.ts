import * as vscode from 'vscode';

export class CodeSyncManager {
  public syncCodeToBlocks(): void {
    vscode.window.showInformationMessage('Code to Blocks sync will be implemented soon!');
  }

  public syncBlocksToCode(): void {
    vscode.window.showInformationMessage('Blocks to Code sync will be implemented soon!');
  }

  public onDocumentChange(event: vscode.TextDocumentChangeEvent): void {
    // 處理文檔變更事件，用於自動同步
    console.log('Document changed:', event.document.fileName);
  }
}