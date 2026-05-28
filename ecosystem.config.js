module.exports = {
  apps: [
    {
      name: "wp-ai-bot",
      script: "npx",
      args: "tsx server.ts",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
    },
  ],
};
