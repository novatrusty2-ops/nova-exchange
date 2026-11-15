module.exports = {
  apps: [
    {
      name: 'pouchpay-backend',
      script: 'dist/main.js',
      instances: 'max',
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
