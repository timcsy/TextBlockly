import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  xml: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

export class TemplateManager {
  private templatesPath: string;
  private categoriesPath: string;

  constructor(private context: vscode.ExtensionContext) {
    // 設置模板儲存路徑
    this.templatesPath = path.join(
      context.globalStorageUri?.fsPath || context.extensionPath,
      'templates'
    );
    this.categoriesPath = path.join(this.templatesPath, 'categories.json');

    // 確保目錄存在
    this.ensureDirectoriesExist();
    this.initializeDefaultTemplates();
  }

  public openTemplateManager(): void {
    vscode.window.showInformationMessage(
      'Template Manager will be implemented soon!'
    );
  }

  /**
   * 儲存模板
   */
  public async saveTemplate(
    template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Template> {
    const now = new Date();
    const id = this.generateTemplateId();

    const fullTemplate: Template = {
      id,
      ...template,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const templateFile = path.join(this.templatesPath, `${id}.json`);
      await fs.promises.writeFile(
        templateFile,
        JSON.stringify(fullTemplate, null, 2),
        'utf8'
      );

      return fullTemplate;
    } catch (error) {
      throw new Error(`儲存模板失敗: ${(error as Error).message}`);
    }
  }

  /**
   * 獲取所有模板
   */
  public async getTemplates(category?: string): Promise<Template[]> {
    try {
      if (!fs.existsSync(this.templatesPath)) {
        return [];
      }

      const files = await fs.promises.readdir(this.templatesPath);
      const templateFiles = files.filter(
        (file) => file.endsWith('.json') && file !== 'categories.json'
      );

      const templates: Template[] = [];

      for (const file of templateFiles) {
        try {
          const templatePath = path.join(this.templatesPath, file);
          const content = await fs.promises.readFile(templatePath, 'utf8');
          const template = JSON.parse(content) as Template;

          // 轉換日期字符串為 Date 物件
          template.createdAt = new Date(template.createdAt);
          template.updatedAt = new Date(template.updatedAt);

          if (!category || template.category === category) {
            templates.push(template);
          }
        } catch (error) {
          console.warn(`讀取模板文件 ${file} 失敗:`, error);
        }
      }

      // 按更新時間排序
      return templates.sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
      );
    } catch (error) {
      throw new Error(`獲取模板失敗: ${(error as Error).message}`);
    }
  }

  /**
   * 根據 ID 獲取模板
   */
  public async getTemplate(id: string): Promise<Template | null> {
    try {
      const templatePath = path.join(this.templatesPath, `${id}.json`);

      if (!fs.existsSync(templatePath)) {
        return null;
      }

      const content = await fs.promises.readFile(templatePath, 'utf8');
      const template = JSON.parse(content) as Template;

      // 轉換日期字符串為 Date 物件
      template.createdAt = new Date(template.createdAt);
      template.updatedAt = new Date(template.updatedAt);

      return template;
    } catch (error) {
      throw new Error(`獲取模板失敗: ${(error as Error).message}`);
    }
  }

  /**
   * 更新模板
   */
  public async updateTemplate(
    id: string,
    updates: Partial<Omit<Template, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Template> {
    try {
      const existingTemplate = await this.getTemplate(id);

      if (!existingTemplate) {
        throw new Error('模板不存在');
      }

      const updatedTemplate: Template = {
        ...existingTemplate,
        ...updates,
        updatedAt: new Date(),
      };

      const templatePath = path.join(this.templatesPath, `${id}.json`);
      await fs.promises.writeFile(
        templatePath,
        JSON.stringify(updatedTemplate, null, 2),
        'utf8'
      );

      return updatedTemplate;
    } catch (error) {
      throw new Error(`更新模板失敗: ${(error as Error).message}`);
    }
  }

  /**
   * 刪除模板
   */
  public async deleteTemplate(id: string): Promise<boolean> {
    try {
      const templatePath = path.join(this.templatesPath, `${id}.json`);

      if (!fs.existsSync(templatePath)) {
        return false;
      }

      await fs.promises.unlink(templatePath);
      return true;
    } catch (error) {
      throw new Error(`刪除模板失敗: ${(error as Error).message}`);
    }
  }

  /**
   * 獲取分類列表
   */
  public async getCategories(): Promise<TemplateCategory[]> {
    try {
      if (!fs.existsSync(this.categoriesPath)) {
        return this.getDefaultCategories();
      }

      const content = await fs.promises.readFile(this.categoriesPath, 'utf8');
      return JSON.parse(content) as TemplateCategory[];
    } catch (error) {
      console.warn('讀取分類失敗，使用預設分類:', error);
      return this.getDefaultCategories();
    }
  }

  /**
   * 儲存分類
   */
  public async saveCategories(categories: TemplateCategory[]): Promise<void> {
    try {
      await fs.promises.writeFile(
        this.categoriesPath,
        JSON.stringify(categories, null, 2),
        'utf8'
      );
    } catch (error) {
      throw new Error(`儲存分類失敗: ${(error as Error).message}`);
    }
  }

  /**
   * 匯出模板
   */
  public async exportTemplate(id: string): Promise<string> {
    try {
      const template = await this.getTemplate(id);

      if (!template) {
        throw new Error('模板不存在');
      }

      return JSON.stringify(template, null, 2);
    } catch (error) {
      throw new Error(`匯出模板失敗: ${(error as Error).message}`);
    }
  }

  /**
   * 匯入模板
   */
  public async importTemplate(templateJson: string): Promise<Template> {
    try {
      const templateData = JSON.parse(templateJson);

      // 驗證模板結構
      this.validateTemplateStructure(templateData);

      // 生成新的 ID 避免衝突
      const newId = this.generateTemplateId();
      const template: Template = {
        ...templateData,
        id: newId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const templatePath = path.join(this.templatesPath, `${newId}.json`);
      await fs.promises.writeFile(
        templatePath,
        JSON.stringify(template, null, 2),
        'utf8'
      );

      return template;
    } catch (error) {
      throw new Error(`匯入模板失敗: ${(error as Error).message}`);
    }
  }

  /**
   * 搜尋模板
   */
  public async searchTemplates(
    query: string,
    category?: string
  ): Promise<Template[]> {
    const templates = await this.getTemplates(category);
    const searchTerm = query.toLowerCase();

    return templates.filter(
      (template) =>
        template.name.toLowerCase().includes(searchTerm) ||
        template.description.toLowerCase().includes(searchTerm) ||
        template.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * 確保目錄存在
   */
  private ensureDirectoriesExist(): void {
    try {
      if (!fs.existsSync(this.templatesPath)) {
        fs.mkdirSync(this.templatesPath, { recursive: true });
      }
    } catch (error) {
      console.error('創建模板目錄失敗:', error);
    }
  }

  /**
   * 初始化預設模板
   */
  private async initializeDefaultTemplates(): Promise<void> {
    try {
      const templates = await this.getTemplates();

      if (templates.length === 0) {
        // 創建預設模板
        await this.createDefaultTemplates();
      }

      // 確保分類文件存在
      if (!fs.existsSync(this.categoriesPath)) {
        await this.saveCategories(this.getDefaultCategories());
      }
    } catch (error) {
      console.error('初始化預設模板失敗:', error);
    }
  }

  /**
   * 創建預設模板
   */
  private async createDefaultTemplates(): Promise<void> {
    const defaultTemplates = [
      {
        name: 'LED 閃爍',
        description: '基本的 LED 閃爍範例',
        category: 'basic',
        tags: ['led', 'basic', 'beginner'],
        xml: this.generateLEDBlinkTemplateXML(),
      },
      {
        name: '按鈕控制 LED',
        description: '使用按鈕控制 LED 的開關',
        category: 'input',
        tags: ['button', 'led', 'input'],
        xml: this.generateButtonLEDTemplateXML(),
      },
    ];

    for (const template of defaultTemplates) {
      try {
        await this.saveTemplate(template);
      } catch (error) {
        console.error('創建預設模板失敗:', template.name, error);
      }
    }
  }

  /**
   * 獲取預設分類
   */
  private getDefaultCategories(): TemplateCategory[] {
    return [
      {
        id: 'basic',
        name: '基礎',
        description: '基本的 Arduino 程式範例',
        color: '#4CAF50',
        icon: '🔧',
      },
      {
        id: 'input',
        name: '輸入',
        description: '感測器和輸入裝置範例',
        color: '#2196F3',
        icon: '📡',
      },
      {
        id: 'output',
        name: '輸出',
        description: 'LED、馬達等輸出裝置範例',
        color: '#FF9800',
        icon: '💡',
      },
      {
        id: 'communication',
        name: '通訊',
        description: '串口、I2C、SPI 通訊範例',
        color: '#9C27B0',
        icon: '📶',
      },
      {
        id: 'advanced',
        name: '進階',
        description: '複雜的專案範例',
        color: '#F44336',
        icon: '🚀',
      },
      {
        id: 'custom',
        name: '自訂',
        description: '使用者自訂的模板',
        color: '#607D8B',
        icon: '👤',
      },
    ];
  }

  /**
   * 生成模板 ID
   */
  private generateTemplateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 驗證模板結構
   */
  private validateTemplateStructure(template: any): void {
    const requiredFields = ['name', 'xml'];

    for (const field of requiredFields) {
      if (!template[field]) {
        throw new Error(`模板缺少必要欄位: ${field}`);
      }
    }

    if (typeof template.name !== 'string') {
      throw new Error('模板名稱必須是字符串');
    }

    if (typeof template.xml !== 'string') {
      throw new Error('模板 XML 必須是字符串');
    }
  }

  /**
   * 生成 LED 閃爍模板 XML
   */
  private generateLEDBlinkTemplateXML(): string {
    return `<xml><block type="arduino_setup"><statement name="SETUP_CODE"><block type="arduino_pinmode"><field name="PIN">13</field><field name="MODE">OUTPUT</field></block></statement></block><block type="arduino_loop"><statement name="LOOP_CODE"><block type="arduino_digitalwrite"><field name="PIN">13</field><field name="STATE">HIGH</field><next><block type="arduino_delay"><field name="TIME">1000</field><next><block type="arduino_digitalwrite"><field name="PIN">13</field><field name="STATE">LOW</field><next><block type="arduino_delay"><field name="TIME">1000</field></block></next></block></next></block></next></block></statement></block></xml>`;
  }

  /**
   * 生成按鈕控制 LED 模板 XML
   */
  private generateButtonLEDTemplateXML(): string {
    return `<xml><block type="arduino_setup"><statement name="SETUP_CODE"><block type="arduino_pinmode"><field name="PIN">13</field><field name="MODE">OUTPUT</field><next><block type="arduino_pinmode"><field name="PIN">2</field><field name="MODE">INPUT_PULLUP</field></block></next></block></statement></block><block type="arduino_loop"><statement name="LOOP_CODE"><block type="controls_if"><value name="IF0"><block type="logic_compare"><field name="OP">EQ</field><value name="A"><block type="arduino_digitalread"><field name="PIN">2</field></block></value><value name="B"><block type="logic_boolean"><field name="BOOL">FALSE</field></block></value></block></value><statement name="DO0"><block type="arduino_digitalwrite"><field name="PIN">13</field><field name="STATE">HIGH</field></block></statement><statement name="ELSE"><block type="arduino_digitalwrite"><field name="PIN">13</field><field name="STATE">LOW</field></block></statement></block></statement></block></xml>`;
  }
}
