// Jest 測試環境設置

// 增加測試超時時間
jest.setTimeout(30000);

// 清除所有 console.log 在測試中的輸出
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};