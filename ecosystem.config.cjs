module.exports = {
  apps: [
    {
      name: "api",
      script: "dist/server.js",
      instances: "1",
      exec_mode: "cluster",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};