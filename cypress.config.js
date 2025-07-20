const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    // baseUrl removido para permitir testes sem servidor rodando
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    retries: {
      runMode: 2,
      openMode: 0
    },
    env: {
      apiUrl: 'http://localhost:3000',
      coverage: true,
      useMockServer: false
    },
    setupNodeEvents(on, config) {
      // Configurações de relatórios
      on('task', {
        log(message) {
          console.log(message)
          return null
        }
      })

      return config
      
    }
  },
  reporter: 'mochawesome',
  reporterOptions: {
    reportDir: 'cypress/reports',
    overwrite: false,
    html: true,
    json: true,
    timestamp: 'mmddyyyy_HHMMss'
  }
})
