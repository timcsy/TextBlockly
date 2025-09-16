import * as vscode from 'vscode';

export class TemplateManager {
  constructor(private context: vscode.ExtensionContext) {}

  public openTemplateManager(): void {
    vscode.window.showInformationMessage('Template Manager will be implemented soon!');
  }
}