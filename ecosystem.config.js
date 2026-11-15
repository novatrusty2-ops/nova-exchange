module.exports = {
  apps: [
    {
      name: 'pouchpay-backend',
      script: './pouchpay-corrected/dist/main.js',
      instances: 24,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      max_memory_restart: '1G',
      error_file: './logs/pouchpay-error.log',
      out_file: './logs/pouchpay-out.log',
      merge_logs: true
    }
  ]
};
