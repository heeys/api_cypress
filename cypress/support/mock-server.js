// cypress/support/mock-server.js

let users = []
let tickets = []
let nextUserId = 1
let nextTicketId = 1

// Interceptações para simular a API
Cypress.Commands.add('setupMockServer', () => {
  // Reset data
  users = []
  tickets = []
  nextUserId = 1
  nextTicketId = 1

  const apiUrl = Cypress.env('apiUrl')

  // Mock GET /users
  cy.intercept('GET', `${apiUrl}/users`, {
    statusCode: 200,
    body: users,
    headers: {
      'content-type': 'application/json'
    }
  }).as('getUsers')

  // Mock POST /users
  cy.intercept('POST', `${apiUrl}/users`, (req) => {
    const newUser = {
      id: nextUserId++,
      ...req.body,
      createdAt: new Date().toISOString()
    }
    users.push(newUser)
    req.reply({
      statusCode: 201,
      body: newUser,
      headers: {
        'content-type': 'application/json'
      }
    })
  }).as('createUser')

  // Mock GET /users/:id
  cy.intercept('GET', `${apiUrl}/users/*`, (req) => {
    const userId = parseInt(req.url.split('/').pop())
    const user = users.find(u => u.id === userId)
    
    if (user) {
      req.reply({
        statusCode: 200,
        body: user,
        headers: {
          'content-type': 'application/json'
        }
      })
    } else {
      req.reply({
        statusCode: 404,
        body: { error: 'User not found' },
        headers: {
          'content-type': 'application/json'
        }
      })
    }
  }).as('getUserById')

  // Mock PUT /users/:id
  cy.intercept('PUT', `${apiUrl}/users/*`, (req) => {
    const userId = parseInt(req.url.split('/').pop())
    const userIndex = users.findIndex(u => u.id === userId)
    
    if (userIndex !== -1) {
      users[userIndex] = {
        ...users[userIndex],
        ...req.body,
        updatedAt: new Date().toISOString()
      }
      req.reply({
        statusCode: 200,
        body: users[userIndex],
        headers: {
          'content-type': 'application/json'
        }
      })
    } else {
      req.reply({
        statusCode: 404,
        body: { error: 'User not found' },
        headers: {
          'content-type': 'application/json'
        }
      })
    }
  }).as('updateUser')

  // Mock DELETE /users/:id
  cy.intercept('DELETE', `${apiUrl}/users/*`, (req) => {
    const userId = parseInt(req.url.split('/').pop())
    const userIndex = users.findIndex(u => u.id === userId)
    
    if (userIndex !== -1) {
      users.splice(userIndex, 1)
      req.reply({
        statusCode: 204,
        headers: {
          'content-type': 'application/json'
        }
      })
    } else {
      req.reply({
        statusCode: 404,
        body: { error: 'User not found' },
        headers: {
          'content-type': 'application/json'
        }
      })
    }
  }).as('deleteUser')

  // Mock GET /tickets
  cy.intercept('GET', `${apiUrl}/tickets`, {
    statusCode: 200,
    body: tickets,
    headers: {
      'content-type': 'application/json'
    }
  }).as('getTickets')

  // Mock POST /tickets
  cy.intercept('POST', `${apiUrl}/tickets`, (req) => {
    const newTicket = {
      id: nextTicketId++,
      ...req.body,
      status: req.body.status || 'Open',
      createdAt: new Date().toISOString()
    }
    tickets.push(newTicket)
    req.reply({
      statusCode: 201,
      body: newTicket,
      headers: {
        'content-type': 'application/json'
      }
    })
  }).as('createTicket')

  // Mock GET /tickets/:id
  cy.intercept('GET', `${apiUrl}/tickets/*`, (req) => {
    const ticketId = parseInt(req.url.split('/').pop())
    const ticket = tickets.find(t => t.id === ticketId)
    
    if (ticket) {
      req.reply({
        statusCode: 200,
        body: ticket,
        headers: {
          'content-type': 'application/json'
        }
      })
    } else {
      req.reply({
        statusCode: 404,
        body: { error: 'Ticket not found' },
        headers: {
          'content-type': 'application/json'
        }
      })
    }
  }).as('getTicketById')

  // Mock PUT /tickets/:id
  cy.intercept('PUT', `${apiUrl}/tickets/*`, (req) => {
    const ticketId = parseInt(req.url.split('/').pop())
    const ticketIndex = tickets.findIndex(t => t.id === ticketId)
    
    if (ticketIndex !== -1) {
      tickets[ticketIndex] = {
        ...tickets[ticketIndex],
        ...req.body,
        updatedAt: new Date().toISOString()
      }
      req.reply({
        statusCode: 200,
        body: tickets[ticketIndex],
        headers: {
          'content-type': 'application/json'
        }
      })
    } else {
      req.reply({
        statusCode: 404,
        body: { error: 'Ticket not found' },
        headers: {
          'content-type': 'application/json'
        }
      })
    }
  }).as('updateTicket')

  // Mock DELETE /tickets/:id
  cy.intercept('DELETE', `${apiUrl}/tickets/*`, (req) => {
    const ticketId = parseInt(req.url.split('/').pop())
    const ticketIndex = tickets.findIndex(t => t.id === ticketId)
    
    if (ticketIndex !== -1) {
      tickets.splice(ticketIndex, 1)
      req.reply({
        statusCode: 204,
        headers: {
          'content-type': 'application/json'
        }
      })
    } else {
      req.reply({
        statusCode: 404,
        body: { error: 'Ticket not found' },
        headers: {
          'content-type': 'application/json'
        }
      })
    }
  }).as('deleteTicket')
})
