// cypress/support/commands.js

// Comando para limpar todos os dados
Cypress.Commands.add('cleanupData', () => {
  // Limpa todos os usuários
  cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/users`,
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200 && response.body.length > 0) {
      response.body.forEach(user => {
        cy.request({
          method: 'DELETE',
          url: `${Cypress.env('apiUrl')}/users/${user.id}`,
          failOnStatusCode: false
        })
      })
    }
  })

  // Limpa todos os tickets
  cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/tickets`,
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200 && response.body.length > 0) {
      response.body.forEach(ticket => {
        cy.request({
          method: 'DELETE',
          url: `${Cypress.env('apiUrl')}/tickets/${ticket.id}`,
          failOnStatusCode: false
        })
      })
    }
  })
})

// Comando para validar tempo de resposta
Cypress.Commands.add('validateResponseTime', (response, maxTime = 2000) => {
  expect(response.duration).to.be.lessThan(maxTime)
})

// Comando para validar cabeçalhos comuns
Cypress.Commands.add('validateCommonHeaders', (response) => {
  expect(response.headers).to.have.property('content-type')
  expect(response.headers['content-type']).to.include('application/json')
})

// Comando para gerar dados únicos
Cypress.Commands.add('generateUniqueData', (type) => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  
  switch (type) {
    case 'user':
      return {
        name: `Test User ${timestamp}`,
        email: `test${timestamp}${random}@example.com`
      }
    case 'ticket':
      return {
        description: `Test ticket description ${timestamp} - ${random}`,
        userId: null // Será preenchido conforme necessário
      }
    default:
      return {}
  }
})
