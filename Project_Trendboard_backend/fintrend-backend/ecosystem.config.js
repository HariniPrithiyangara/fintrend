module.exports = {
  apps: [
    {
      name: 'fintrend-backend',
      script: './server.js',
      instances: 1,
      autorestart: true,
      watch: false, // IMPORTANT: Disable watch to prevent restarts
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      }, 
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      // Cron restart - optional (restarts daily at 3 AM)
      cron_restart: '0 3 * * *',
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    }
  ]
};