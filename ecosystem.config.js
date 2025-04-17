export default  {
  apps: [{
    name: 'app-with-sockets',
    script: './server.js',
    watch: true,
    ignore_watch: [
      'node_modules',
      'logs',
      '.git'
    ],
    env: {
      NODE_ENV: 'development'
    },
    kill_timeout: 3000,  
    wait_ready: true, 
    listen_timeout: 5000 
  }]
}