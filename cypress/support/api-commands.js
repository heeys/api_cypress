// cypress/support/api-commands.js

// ===== COMANDOS PARA USUÁRIOS =====

// Criar usuário
Cypress.Commands.add('createUser', (userData = null) => {
  if (userData) {
    return cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/users`,
      body: userData,
      failOnStatusCode: false
    }).then((response) => {
      cy.validateResponseTime(response)
      cy.validateCommonHeaders(response)
      return cy.wrap(response)
    })
  } else {
    return cy.generateUniqueData('user').then((user) => {
      return cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/users`,
        body: user,
        failOnStatusCode: false
      }).then((response) => {
        cy.validateResponseTime(response)
        cy.validateCommonHeaders(response)
        return cy.wrap(response)
      })
    })
  }
})

// Listar usuários
Cypress.Commands.add('getUsers', () => {
  return cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/users`,
    failOnStatusCode: false
  }).then((response) => {
    cy.validateResponseTime(response)
    cy.validateCommonHeaders(response)
    return cy.wrap(response)
  })
})

// Buscar usuário por ID
Cypress.Commands.add('getUserById', (userId) => {
  return cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/users/${userId}`,
    failOnStatusCode: false
  }).then((response) => {
    cy.validateResponseTime(response)
    cy.validateCommonHeaders(response)
    return cy.wrap(response)
  })
})

// Atualizar usuário
Cypress.Commands.add('updateUser', (userId, userData) => {
  return cy.request({
    method: 'PUT',
    url: `${Cypress.env('apiUrl')}/users/${userId}`,
    body: userData,
    failOnStatusCode: false
  }).then((response) => {
    cy.validateResponseTime(response)
    cy.validateCommonHeaders(response)
    return cy.wrap(response)
  })
})

// Deletar usuário
Cypress.Commands.add('deleteUser', (userId) => {
  return cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiUrl')}/users/${userId}`,
    failOnStatusCode: false
  }).then((response) => {
    cy.validateResponseTime(response)
    cy.validateCommonHeaders(response)
    return cy.wrap(response)
  })
})

// ===== COMANDOS PARA TICKETS =====

// Criar ticket
Cypress.Commands.add('createTicket', (ticketData) => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/tickets`,
    body: ticketData,
    failOnStatusCode: false
  }).then((response) => {
    cy.validateResponseTime(response)
    cy.validateCommonHeaders(response)
    return cy.wrap(response)
  })
})

// Listar tickets
Cypress.Commands.add('getTickets', () => {
  return cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/tickets`,
    failOnStatusCode: false
  }).then((response) => {
    cy.validateResponseTime(response)
    cy.validateCommonHeaders(response)
    return cy.wrap(response)
  })
})

// Buscar ticket por ID
Cypress.Commands.add('getTicketById', (ticketId) => {
  return cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/tickets/${ticketId}`,
    failOnStatusCode: false
  }).then((response) => {
    cy.validateResponseTime(response)
    cy.validateCommonHeaders(response)
    return cy.wrap(response)
  })
})

// Atualizar ticket
Cypress.Commands.add('updateTicket', (ticketId, ticketData) => {
  return cy.request({
    method: 'PUT',
    url: `${Cypress.env('apiUrl')}/tickets/${ticketId}`,
    body: ticketData,
    failOnStatusCode: false
  }).then((response) => {
    cy.validateResponseTime(response)
    cy.validateCommonHeaders(response)
    return cy.wrap(response)
  })
})

// Deletar ticket
Cypress.Commands.add('deleteTicket', (ticketId) => {
  return cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiUrl')}/tickets/${ticketId}`,
    failOnStatusCode: false
  }).then((response) => {
    cy.validateResponseTime(response)
    cy.validateCommonHeaders(response)
    return cy.wrap(response)
  })
})

// ===== COMANDOS PARA TICKETS COM DADOS ÚNICOS =====

// Criar ticket com dados únicos
Cypress.Commands.add('createUniqueTicket', (userId, ticketData = null) => {
  if (ticketData) {
    ticketData.userId = userId
    return cy.createTicket(ticketData)
  } else {
    return cy.generateUniqueData('ticket').then((ticket) => {
      ticket.userId = userId
      return cy.createTicket(ticket)
    })
  }
})

// ===== COMANDOS AUXILIARES =====

// Criar usuário e retornar apenas o ID
Cypress.Commands.add('createUserAndGetId', (userData = null) => {
  return cy.createUser(userData).then((response) => {
    if (response.status === 201) {
      return cy.wrap(response.body.id)
    } else {
      throw new Error(`Failed to create user: ${response.status}`)
    }
  })
})

// Validar estrutura de resposta de usuário
Cypress.Commands.add('validateUserResponse', (user) => {
  expect(user).to.have.property('id')
  expect(user).to.have.property('name')
  expect(user).to.have.property('email')
  expect(user.id).to.be.a('number')
  expect(user.name).to.be.a('string')
  expect(user.email).to.be.a('string').and.include('@')
})

// Validar estrutura de resposta de ticket
Cypress.Commands.add('validateTicketResponse', (ticket) => {
  expect(ticket).to.have.property('id')
  expect(ticket).to.have.property('userId')
  expect(ticket).to.have.property('description')
  expect(ticket).to.have.property('status')
  expect(ticket.id).to.be.a('number')
  expect(ticket.userId).to.be.a('number')
  expect(ticket.description).to.be.a('string')
  expect(ticket.status).to.be.a('string')
})

// Atualizar status do ticket
Cypress.Commands.add('updateTicketStatus', (ticketId, newStatus) => {
  return cy.request({
    method: 'PUT',
    url: `${Cypress.env('apiUrl')}/tickets/${ticketId}/status`,
    body: { status: newStatus },
    failOnStatusCode: false
  }).then((response) => {
    cy.validateResponseTime(response)
    cy.validateCommonHeaders(response)
    return cy.wrap(response)
  })
})
