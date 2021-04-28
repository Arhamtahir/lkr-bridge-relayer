module.exports = {
    apps: [
      {
        name: 'polkalokr-migration-server',
        script: 'npx',
        args: 'serve -s build -l 4000 -n',
        interpreter: 'none',
        env: {
          NODE_ENV: 'development',
        },
      },
    ],
  }