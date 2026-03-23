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
        PORT: 3000,
        X_BEARER_TOKEN: "AAAAAAAAAAAAAAAAAAAAALJf7wEAAAAAM95zUkz26US1aCZgPi8g6TjqxCY%3D1CLjNFr81W7DhajXDzAnIbQDsj4FiKK05PiP4o3sHHCwKEQmG9"
      }
    }
  ]
};