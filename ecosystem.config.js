module.exports = {
  apps: [
    {
      name: 'erp-api',
      script: 'dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3333,
      },
    },
  ],
};
