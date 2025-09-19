/**
 * 基於AST的雙向同步管理器
 * 使用AST確保更準確和穩健的程式碼同步
 */

import * as vscode from 'vscode';
import { ArduinoParser } from '../ast/ArduinoParser';
import { ASTToBlocks, BlocklyWorkspace } from '../ast/ASTToBlocks';
import { ArduinoCodeGenerator } from '../arduino/CodeGenerator';

export interface SyncResult {
  success: boolean;
  workspace?: BlocklyWorkspace;
  xml?: string;
  error?: string;
  parseErrors?: string[];
  warnings?: string[];
}

export class ASTSyncManager {
  private parser: ArduinoParser | null = null;
  private astToBlocks: ASTToBlocks;
  private codeGenerator: ArduinoCodeGenerator;

  constructor() {
    this.astToBlocks = new ASTToBlocks();
    this.codeGenerator = new ArduinoCodeGenerator();
  }

  /**
   * 程式碼同步到積木 (Code → Blocks)
   */
  public async syncCodeToBlocks(code: string): Promise<SyncResult> {
    try {
      console.log('=== AST同步：程式碼 → 積木 ===');
      console.log('輸入程式碼長度:', code.length);
      console.log('程式碼預覽:', code.substring(0, 200) + (code.length > 200 ? '...' : ''));

      // 檢查程式碼是否為空
      if (!code || code.trim().length === 0) {
        console.warn('程式碼為空，創建基本結構');
        return this.createEmptyWorkspace();
      }

      // 第一步：程式碼 → AST
      console.log('步驟1: 開始AST解析...');
      this.parser = new ArduinoParser(code);
      const ast = this.parser.parse();

      console.log('AST解析完成:');
      console.log(`- 頂層節點數: ${ast.body.length}`);

      // 檢查AST是否有效
      if (!ast || !ast.body || ast.body.length === 0) {
        console.warn('AST解析結果為空，可能是語法錯誤');
        return {
          success: false,
          error: '無法解析程式碼，請檢查語法',
          parseErrors: ['程式碼結構無法識別']
        };
      }

      const functions = ast.body.filter(node => node.type === 'FunctionDeclaration');
      const variables = ast.body.filter(node => node.type === 'VariableDeclaration');

      console.log(`- 函數數量: ${functions.length}`);
      console.log(`- 全域變數數量: ${variables.length}`);

      // 檢查必要的setup和loop函數
      const setupFunc = functions.find((f: any) => f.name.name === 'setup');
      const loopFunc = functions.find((f: any) => f.name.name === 'loop');

      const warnings: string[] = [];
      if (!setupFunc) {
        warnings.push('未找到setup()函數，將創建空的setup積木');
      }
      if (!loopFunc) {
        warnings.push('未找到loop()函數，將創建空的loop積木');
      }

      // 第二步：AST → Blockly工作區
      console.log('步驟2: 開始積木轉換...');
      const workspace = this.astToBlocks.convertProgram(ast);

      console.log('積木轉換完成:');
      console.log(`- Setup積木: ${workspace.setupBlocks.length}`);
      console.log(`- Loop積木: ${workspace.loopBlocks.length}`);
      console.log(`- 全域變數: ${workspace.globalVariables.length}`);

      // 驗證工作區內容
      if (!workspace.setupBlocks && !workspace.loopBlocks && !workspace.globalVariables) {
        console.warn('工作區轉換結果為空');
        warnings.push('無法轉換任何積木，使用基本結構');
      }

      // 第三步：生成Blockly XML
      console.log('步驟3: 生成Blockly XML...');
      const xml = this.generateBlocklyXML(workspace);

      console.log('XML生成完成:');
      console.log(`- XML長度: ${xml.length}`);
      console.log('- XML預覽:', xml.substring(0, 300) + (xml.length > 300 ? '...' : ''));

      // 驗證XML格式
      if (!xml || xml.length < 50 || !xml.includes('<xml')) {
        console.error('生成的XML無效');
        return {
          success: false,
          error: 'XML生成失敗',
          workspace
        };
      }

      return {
        success: true,
        workspace,
        xml,
        warnings
      };

    } catch (error) {
      console.error('AST同步錯誤:', error);
      console.error('錯誤堆疊:', error instanceof Error ? error.stack : 'No stack trace');

      // 提供更詳細的錯誤信息
      const errorMessage = error instanceof Error ? error.message : String(error);
      const detailedError = `同步失敗: ${errorMessage}`;

      return {
        success: false,
        error: detailedError,
        parseErrors: [errorMessage]
      };
    }
  }

  /**
   * 創建空的工作區（當程式碼為空或解析失敗時使用）
   */
  private createEmptyWorkspace(): SyncResult {
    const emptyWorkspace = {
      setupBlocks: [],
      loopBlocks: [],
      globalVariables: []
    };

    const xml = this.generateBlocklyXML(emptyWorkspace);

    return {
      success: true,
      workspace: emptyWorkspace,
      xml,
      warnings: ['創建了空的Arduino結構']
    };
  }

  /**
   * 積木同步到程式碼 (Blocks → Code)
   * 暫時使用現有的CodeGenerator，未來可以改為從XML解析
   */
  public async syncBlocksToCode(xml: string): Promise<{ success: boolean; code?: string; error?: string }> {
    try {
      console.log('=== AST同步：積木 → 程式碼 ===');

      // 暫時使用現有的生成器
      // TODO: 實現XML → AST → Code的完整流程
      const result = await this.codeGenerator.generateCode(xml);
      const code = typeof result === 'string' ? result : result.code;

      return {
        success: true,
        code
      };

    } catch (error) {
      console.error('積木轉程式碼錯誤:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 生成Blockly XML
   */
  private generateBlocklyXML(workspace: BlocklyWorkspace): string {
    try {
      console.log('開始生成XML...');
      const xmlParts: string[] = [];
      xmlParts.push('<xml xmlns="https://developers.google.com/blockly/xml">');

      // Setup積木 (x=50, y=50)
      console.log('生成Setup積木...');
      xmlParts.push('  <block type="arduino_setup" x="50" y="50">');
      if (workspace.setupBlocks && workspace.setupBlocks.length > 0) {
        console.log(`- 包含${workspace.setupBlocks.length}個setup積木`);
        xmlParts.push('    <statement name="SETUP_CODE">');
        const setupChain = this.generateBlockChain(workspace.setupBlocks, 6);
        if (setupChain) {
          xmlParts.push(setupChain);
        }
        xmlParts.push('    </statement>');
      } else {
        console.log('- Setup積木為空');
      }
      xmlParts.push('  </block>');

      // Loop積木 (x=50, y=300)
      console.log('生成Loop積木...');
      xmlParts.push('  <block type="arduino_loop" x="50" y="300">');
      if (workspace.loopBlocks && workspace.loopBlocks.length > 0) {
        console.log(`- 包含${workspace.loopBlocks.length}個loop積木`);
        xmlParts.push('    <statement name="LOOP_CODE">');
        const loopChain = this.generateBlockChain(workspace.loopBlocks, 6);
        if (loopChain) {
          xmlParts.push(loopChain);
        }
        xmlParts.push('    </statement>');
      } else {
        console.log('- Loop積木為空');
      }
      xmlParts.push('  </block>');

      // 全域變數積木 (如果有的話，放在右側)
      console.log('生成全域變數積木...');
      if (workspace.globalVariables && workspace.globalVariables.length > 0) {
        console.log(`- 包含${workspace.globalVariables.length}個全域變數`);
        let yPos = 50;
        for (const variable of workspace.globalVariables) {
          try {
            xmlParts.push(`  <block type="${variable.type}" x="400" y="${yPos}">`);
            xmlParts.push(this.generateBlockFields(variable, 4));
            xmlParts.push(this.generateBlockInputs(variable, 4));
            xmlParts.push('  </block>');
            yPos += 80; // 間距
          } catch (varError) {
            console.error('生成變數積木錯誤:', varError);
            // 繼續處理其他變數
          }
        }
      } else {
        console.log('- 無全域變數');
      }

      xmlParts.push('</xml>');

      const result = xmlParts.join('\n');
      console.log('XML生成完成，總長度:', result.length);
      return result;

    } catch (error) {
      console.error('generateBlocklyXML錯誤:', error);
      // 返回最基本的XML結構
      return `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="50" y="50">
  </block>
  <block type="arduino_loop" x="50" y="300">
  </block>
</xml>`;
    }
  }

  /**
   * 生成積木鏈
   */
  private generateBlockChain(blocks: any[], indent: number): string {
    if (!blocks || blocks.length === 0) {
      console.log('積木鏈為空');
      return '';
    }

    console.log(`生成積木鏈，包含${blocks.length}個積木`);
    const spaces = ' '.repeat(indent);
    const xmlParts: string[] = [];

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const isLast = i === blocks.length - 1;

      try {
        // 驗證積木結構
        if (!block || !block.type) {
          console.warn(`積木${i}缺少type屬性:`, block);
          continue;
        }

        console.log(`- 處理積木${i}: ${block.type}`);
        xmlParts.push(`${spaces}<block type="${block.type}">`);

        const fields = this.generateBlockFields(block, indent + 2);
        const inputs = this.generateBlockInputs(block, indent + 2);

        if (fields) xmlParts.push(fields);
        if (inputs) xmlParts.push(inputs);

        if (!isLast) {
          xmlParts.push(`${spaces}  <next>`);
          xmlParts.push(this.generateBlockChain(blocks.slice(i + 1), indent + 4));
          xmlParts.push(`${spaces}  </next>`);
          xmlParts.push(`${spaces}</block>`);
          break;
        } else {
          xmlParts.push(`${spaces}</block>`);
        }
      } catch (blockError) {
        console.error(`生成積木${i}錯誤:`, blockError);
        // 跳過這個積木，繼續處理其他積木
        continue;
      }
    }

    const result = xmlParts.join('\n');
    console.log(`積木鏈生成完成，長度: ${result.length}`);
    return result;
  }

  /**
   * 生成積木欄位
   */
  private generateBlockFields(block: any, indent: number): string {
    if (!block.fields) return '';

    const spaces = ' '.repeat(indent);
    const xmlParts: string[] = [];

    for (const [fieldName, fieldValue] of Object.entries(block.fields)) {
      // 對於變數字段，確保輸出變數名稱而不是 ID
      let actualValue = fieldValue;
      if (fieldName === 'VAR' && typeof fieldValue === 'string') {
        // 變數字段應該直接使用變數名稱，不需要特殊處理
        // 這裡的 fieldValue 應該已經是正確的變數名稱了
        actualValue = fieldValue;
      }

      xmlParts.push(`${spaces}<field name="${fieldName}">${actualValue}</field>`);
    }

    return xmlParts.join('\n');
  }

  /**
   * 生成積木輸入
   */
  private generateBlockInputs(block: any, indent: number): string {
    if (!block.inputs) return '';

    const spaces = ' '.repeat(indent);
    const xmlParts: string[] = [];

    for (const [inputName, inputValue] of Object.entries(block.inputs)) {
      if (inputValue) {
        if (Array.isArray(inputValue)) {
          // 語句輸入
          if (inputValue.length > 0) {
            xmlParts.push(`${spaces}<statement name="${inputName}">`);
            xmlParts.push(this.generateBlockChain(inputValue, indent + 2));
            xmlParts.push(`${spaces}</statement>`);
          }
        } else if (typeof inputValue === 'object' && (inputValue as any).type) {
          // 值輸入
          xmlParts.push(`${spaces}<value name="${inputName}">`);
          xmlParts.push(this.generateSingleBlock(inputValue, indent + 2));
          xmlParts.push(`${spaces}</value>`);
        }
      }
    }

    return xmlParts.join('\n');
  }

  /**
   * 生成單個積木
   */
  private generateSingleBlock(block: any, indent: number): string {
    const spaces = ' '.repeat(indent);
    const xmlParts: string[] = [];

    xmlParts.push(`${spaces}<block type="${block.type}">`);
    xmlParts.push(this.generateBlockFields(block, indent + 2));
    xmlParts.push(this.generateBlockInputs(block, indent + 2));
    xmlParts.push(`${spaces}</block>`);

    return xmlParts.join('\n');
  }

  /**
   * 驗證同步結果
   */
  public async validateSync(originalCode: string, reconstructedCode: string): Promise<{
    similarity: number;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // 解析兩段程式碼
      const originalAST = new ArduinoParser(originalCode).parse();
      const reconstructedAST = new ArduinoParser(reconstructedCode).parse();

      // 比較AST結構
      const similarity = this.compareASTs(originalAST, reconstructedAST);

      // 檢查常見問題
      if (similarity < 80) {
        issues.push(`程式碼相似度較低 (${similarity.toFixed(1)}%)`);
        recommendations.push('檢查是否有複雜的表達式被轉換為萬用積木');
      }

      // 檢查函數完整性
      const originalFunctions = originalAST.body.filter((node: any) => node.type === 'FunctionDeclaration');
      const reconstructedFunctions = reconstructedAST.body.filter((node: any) => node.type === 'FunctionDeclaration');

      if (originalFunctions.length !== reconstructedFunctions.length) {
        issues.push('函數數量不匹配');
      }

      return {
        similarity,
        issues,
        recommendations
      };

    } catch (error) {
      issues.push(`驗證失敗: ${error}`);
      return {
        similarity: 0,
        issues,
        recommendations: ['請檢查程式碼語法是否正確']
      };
    }
  }

  /**
   * 比較兩個AST的相似度
   */
  private compareASTs(ast1: any, ast2: any): number {
    // 簡化的AST比較 - 可以進一步改進
    const str1 = JSON.stringify(ast1, this.astStringifyReplacer);
    const str2 = JSON.stringify(ast2, this.astStringifyReplacer);

    if (str1 === str2) return 100;

    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);

    return maxLength > 0 ? Math.max(0, ((maxLength - distance) / maxLength) * 100) : 0;
  }

  /**
   * AST序列化替換器（忽略位置信息）
   */
  private astStringifyReplacer(key: string, value: any): any {
    if (['start', 'end', 'line', 'column', 'source'].includes(key)) {
      return undefined; // 忽略位置信息
    }
    return value;
  }

  /**
   * 編輯距離計算
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * 獲取統計信息
   */
  public getStats(): {
    totalParses: number;
    successfulParses: number;
    averageSimilarity: number;
    commonErrors: string[];
  } {
    // TODO: 實現統計追蹤
    return {
      totalParses: 0,
      successfulParses: 0,
      averageSimilarity: 0,
      commonErrors: []
    };
  }
}