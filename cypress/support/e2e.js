// cypress/support/e2e.js
import './commands'
import './api-commands'
import './utils/schema-validator'
import './mock-server'

// Configurações globais
Cypress.on('uncaught:exception', (err, runnable) => {
  return false
})

// Hook para limpar dados antes de cada teste
beforeEach(() => {
  cy.task('log', `Iniciando teste: ${Cypress.currentTest.title}`)
})

afterEach(() => {
  cy.task('log', `Finalizando teste: ${Cypress.currentTest.title}`)
})
