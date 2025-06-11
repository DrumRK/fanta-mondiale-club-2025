class ConfigService {
  static _config = null;

  // Load configuration lazily
  static getConfig() {
    if (!this._config) {
      this._config = {
        rapidApiKey: process.env.RAPID_API_KEY,
        rapidApiHost: "api-football-v1.p.rapidapi.com",
        databaseUrl: process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 3001
      };

      // Validate required config
      if (!this._config.rapidApiKey) {
        throw new Error('RAPID_API_KEY environment variable is required');
      }
      
      if (!this._config.databaseUrl) {
        throw new Error('DATABASE_URL environment variable is required');
      }

      console.log('✅ Configuration loaded successfully');
      console.log('🔑 API Key loaded:', this._config.rapidApiKey ? 'Yes' : 'No');
      console.log('🗄️ Database URL loaded:', this._config.databaseUrl ? 'Yes' : 'No');
    }

    return this._config;
  }

  // Get specific config values
  static getRapidApiKey() {
    return this.getConfig().rapidApiKey;
  }

  static getRapidApiHost() {
    return this.getConfig().rapidApiHost;
  }

  static getDatabaseUrl() {
    return this.getConfig().databaseUrl;
  }

  static getNodeEnv() {
    return this.getConfig().nodeEnv;
  }

  static getPort() {
    return this.getConfig().port;
  }

  // Validate configuration
  static validateConfig() {
    try {
      const config = this.getConfig();
      
      const issues = [];
      
      if (!config.rapidApiKey) {
        issues.push('Missing RAPID_API_KEY');
      }
      
      if (!config.databaseUrl) {
        issues.push('Missing DATABASE_URL');
      }
      
      if (issues.length > 0) {
        throw new Error(`Configuration issues: ${issues.join(', ')}`);
      }
      
      console.log('✅ Configuration validation passed');
      return true;
    } catch (error) {
      console.error('❌ Configuration validation failed:', error.message);
      throw error;
    }
  }

  // Reset config (useful for testing)
  static reset() {
    this._config = null;
  }
}

export default ConfigService;