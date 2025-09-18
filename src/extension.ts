import * as vscode from 'vscode';
import { BlocklyViewProvider } from './webview/BlocklyViewProvider';
import { TemplateManager } from './template/TemplateManager';
import { CodeSyncManager } from './sync/CodeSyncManager';

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  // 顯示啟用消息
  vscode.window.showInformationMessage('TextBlockly extension is now active!');

  // 初始化核心管理器
  const templateManager = new TemplateManager(context);
  const codeSyncManager = new CodeSyncManager();
  const blocklyViewProvider = new BlocklyViewProvider(
    context,
    templateManager,
    codeSyncManager
  );

  // 註冊命令
  const commands = [
    vscode.commands.registerCommand('textblockly.openBlocklyView', async (uri?: vscode.Uri) => {
      return await blocklyViewProvider.createOrShow(uri);
    }),

    vscode.commands.registerCommand('textblockly.syncCodeToBlocks', () => {
      return codeSyncManager.syncCodeToBlocks();
    }),

    vscode.commands.registerCommand('textblockly.syncBlocksToCode', () => {
      return codeSyncManager.syncBlocksToCode();
    }),

    vscode.commands.registerCommand('textblockly.openTemplateManager', () => {
      return templateManager.openTemplateManager();
    }),
  ];

  // 將命令加入訂閱清單
  context.subscriptions.push(...commands);

  // 監聽文檔變更事件（用於自動同步）
  const onDocumentChange = vscode.workspace.onDidChangeTextDocument((event) => {
    if (event.document.languageId === 'arduino') {
      codeSyncManager.onDocumentChange(event);
    }
  });

  context.subscriptions.push(onDocumentChange);
}

export function deactivate(): void {
  // 清理資源時執行
}
