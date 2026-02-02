module.exports = {
  apps: [
    {
      name: "numars-pos-backend",
      script: "server.js",
      cwd: "/home/numarsadmin/fullnumars/backend",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 4000
      }
    }
  ]
}
