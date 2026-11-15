module.exports = {
  "apps": [
    {
      "name": "pouchpay-backend",
      "namespace": "pouchpay",
      "cwd": "/home/art-city/nova-apk-builds/pouchpay-corrected",
      "script": "/home/art-city/nova-apk-builds/pouchpay-corrected/dist/main.js",
      "exec_mode": "cluster",
      "instances": 24,
      "env": {
        "NODE_ENV": "production",
        "PORT": 3000
      },
      "autorestart": true,
      "watch": false,
      "merge_logs": true,
      "max_memory_restart": 524288000
    }
  ]
};
