module.exports = {
  apps: [
    {
      name: 'otea-server',
      script: 'js/server.js',
      cwd: './',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/otea-server-error.log',
      out_file: './logs/otea-server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    }
  ]
};
