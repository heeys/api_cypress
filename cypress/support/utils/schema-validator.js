// cypress/support/utils/schema-validator.js

const Ajv = require('ajv')
const addFormats = require('ajv-formats')

const ajv = new Ajv({ allErrors: true })
addFormats(ajv)

// Validador de schema de usuário
Cypress.Commands.add('validateUserSchema', (userData) => {
  cy.fixture('schemas/user-schema.json').then((schema) => {
    const validate = ajv.compile(schema)
    const isValid = validate(userData)
    
    if (!isValid) {
      cy.log('Erros de validação de schema:', validate.errors)
      throw new Error(`Schema validation failed: ${JSON.stringify(validate.errors)}`)
    }
    
    expect(isValid).to.be.true
  })
})

// Validador de schema de ticket
Cypress.Commands.add('validateTicketSchema', (ticketData) => {
  cy.fixture('schemas/ticket-schema.json').then((schema) => {
    const validate = ajv.compile(schema)
    const isValid = validate(ticketData)
    
    if (!isValid) {
      cy.log('Erros de validação de schema:', validate.errors)
      throw new Error(`Schema validation failed: ${JSON.stringify(validate.errors)}`)
    }
    
    expect(isValid).to.be.true
  })
})

// Validador de schema de lista de usuários
Cypress.Commands.add('validateUsersListSchema', (usersList) => {
  expect(usersList).to.be.an('array')
  
  if (usersList.length > 0) {
    usersList.forEach(user => {
      cy.validateUserSchema(user)
    })
  }
})

// Validador de schema de lista de tickets
Cypress.Commands.add('validateTicketsListSchema', (ticketsList) => {
  expect(ticketsList).to.be.an('array')
  
  if (ticketsList.length > 0) {
    ticketsList.forEach(ticket => {
      cy.validateTicketSchema(ticket)
    })
  }
})

// Validador de mensagens de erro
Cypress.Commands.add('validateErrorSchema', (errorResponse) => {
  expect(errorResponse).to.have.property('error')
  expect(errorResponse.error).to.be.a('string')
  expect(errorResponse.error).to.not.be.empty
})
