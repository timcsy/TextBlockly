import * as vscode from 'vscode';
import { TemplateManager } from '../template/TemplateManager';
import { CodeSyncManager } from '../sync/CodeSyncManager';

export class BlocklyViewProvider {
  private panel: vscode.WebviewPanel | undefined;

  constructor(
    private context: vscode.ExtensionContext,
    private templateManager: TemplateManager,
    private codeSyncManager: CodeSyncManager
  ) {}

  public createOrShow(): void {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Two);
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'textblockly',
      'TextBlockly - Visual Programming',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    this.panel.webview.html = this.getWebviewContent();

    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });
  }

  private getWebviewContent(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <title>TextBlockly</title>
      </head>
      <body>
          <h1>TextBlockly - Arduino Visual Programming</h1>
          <div id="blocklyDiv" style="height: 600px; width: 100%;"></div>
      </body>
      </html>
    `;
  }
}