module.exports = {
  apps: [
    {
      name: "api",
      script: "dist/server.js",
      instances: "1",
      exec_mode: "fork",
      watch: false,
      env_file: ".env",
      env: {
        NODE_ENV: "production",
      }
    }
  ]
};