// Backend only. The full PM2 setup for this PC (backend, monitors, local node, Nova X/Plus) is ../ecosystem.config.js.
module.exports = {
  apps: [
    {
      name: 'pouchpay-backend',
      script: 'dist/main.js',
      instances: 2, // was 'max' (24 on this PC)
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      max_memory_restart: '500M',
      autorestart: true,
      watch: false,
    },
  ],
};
