module.exports = {
  apps: [
    {
      name: 'ml-api',
      script: '/usr/local/bin/python3',
      args: 'main.py',
      cwd: '/home/user/webapp/ml_api',
      interpreter: 'none',
      env: {
        PORT: 8080,
        PYTHONPATH: '/usr/local/lib/python3.11/site-packages'
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
