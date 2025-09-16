// VSCode API Mock for testing

export const commands = {
  registerCommand: jest.fn(),
  executeCommand: jest.fn(),
};

export const window = {
  showInformationMessage: jest.fn(),
  showErrorMessage: jest.fn(),
  showWarningMessage: jest.fn(),
  createWebviewPanel: jest.fn(),
  activeTextEditor: undefined,
};

export const workspace = {
  getConfiguration: jest.fn(() => ({
    get: jest.fn(),
    update: jest.fn(),
  })),
  onDidChangeTextDocument: jest.fn(),
  workspaceFolders: [],
};

export const Uri = {
  file: jest.fn(),
  parse: jest.fn(),
};

export enum ViewColumn {
  One = 1,
  Two = 2,
  Three = 3,
}

export const WebviewOptions = {};

export class ExtensionContext {
  subscriptions: any[] = [];
  workspaceState = {
    get: jest.fn(),
    update: jest.fn(),
  };
  globalState = {
    get: jest.fn(),
    update: jest.fn(),
  };
  extensionPath = '/mock/extension/path';
  asAbsolutePath = jest.fn((relativePath: string) => `/mock/extension/path/${relativePath}`);
}