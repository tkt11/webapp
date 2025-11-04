module.exports = {
  apps: [
    {
      name: 'stock-ai-predictor',
      script: 'npx',
      args: 'wrangler pages dev dist --ip 0.0.0.0 --port 3000',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    },
    {
      name: 'ml-api',
      script: 'python3',
      args: '-m uvicorn main:app --host 0.0.0.0 --port 8080 --timeout-keep-alive 300',
      cwd: '/home/user/ml-api',
      env: {
        PYTHONUNBUFFERED: '1'
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
