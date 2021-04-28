module.exports = {
    apps: [
      {
        name: 'polkalokr-migration-server',
        script: 'npx',
        interpreter: 'none',
        env: {
          NODE_ENV: 'development',
        },
      },
    ],
  }