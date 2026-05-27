const path = require('path');

const botDir = __dirname;

module.exports = {
  apps: [
    {
      name: 'tarik-ai-bot',
      script: 'server.ts',
      interpreter: 'node',
      interpreter_args: '--import tsx',
      cwd: botDir,
      
      // ============================================================
      // AUTO-RESTART: Bot restarts automatically on any crash
      // ============================================================
      watch: false,
      autorestart: true,
      max_restarts: 50,
      min_uptime: '8s',
      restart_delay: 5000,

      // ============================================================
      // ALL API KEYS — hardcoded so PM2 always has them
      // ============================================================
      env: {
        NODE_ENV: 'production',
        PORT: '3001',
        GEMINI_API_KEY: 'AIzaSyAXy42Ua7q19KwSH1FlVcl5ik5ZqGggI6Q',
        GEMINI_API_KEY_2: 'AIzaSyAr_FDVqs91DByTV_mrRIql02Sm7c0Ncl8',
        FEATHERLESS_API_KEY: 'fe_oa_4fe289b7c40d918258d30e8f4f08ec1936cd244d95d7134e',
      },

      // ============================================================
      // LOGGING
      // ============================================================
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      out_file: path.join(botDir, 'logs', 'bot-out.log'),
      error_file: path.join(botDir, 'logs', 'bot-error.log'),
      merge_logs: false,
      max_memory_restart: '700M',

      // ============================================================
      // PERFORMANCE
      // ============================================================
      kill_timeout: 8000,
      listen_timeout: 15000,
    }
  ]
};
