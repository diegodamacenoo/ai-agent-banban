export interface TemplateModuleConfig {
  enabled: boolean;
  logging: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
  };
}

const defaultConfig: TemplateModuleConfig = {
  enabled: true,
  logging: {
    enabled: true,
    level: 'info'
  }
};

export class TemplateModule {
  private config: TemplateModuleConfig;

  constructor(config?: Partial<TemplateModuleConfig>) {
    this.config = {
      ...defaultConfig,
      ...config
    };
  }

  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    // Configura o logger do módulo
    if (this.config.logging.enabled) {
      console.info(`Template Module logging enabled at level: ${this.config.logging.level}`);
    }

    console.info('Módulo Template inicializado com sucesso');
  }
} 