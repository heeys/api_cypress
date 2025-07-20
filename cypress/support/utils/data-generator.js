// cypress/support/utils/data-generator.js

const faker = require('faker')

// Gerador de dados de usuário
const generateUserData = (overrides = {}) => {
  return {
    name: faker.name.findName(),
    email: faker.internet.email(),
    ...overrides
  }
}

// Gerador de dados de ticket
const generateTicketData = (userId, overrides = {}) => {
  return {
    userId: userId,
    description: faker.lorem.sentences(2),
    ...overrides
  }
}

// Gerador de dados inválidos para testes negativos
const generateInvalidUserData = (type) => {
  switch (type) {
    case 'missing_name':
      return { email: faker.internet.email() }
    case 'missing_email':
      return { name: faker.name.findName() }
    case 'empty_name':
      return { name: '', email: faker.internet.email() }
    case 'empty_email':
      return { name: faker.name.findName(), email: '' }
    case 'invalid_email':
      return { name: faker.name.findName(), email: 'invalid-email' }
    case 'long_name':
      return { name: 'a'.repeat(101), email: faker.internet.email() }
    default:
      return {}
  }
}

// Gerador de dados inválidos para tickets
export const generateInvalidTicketData = (type, userId = 1) => {
  switch (type) {
    case 'missing_userId':
      return { description: faker.lorem.sentences(2) }
    case 'missing_description':
      return { userId: userId }
    case 'empty_description':
      return { userId: userId, description: '' }
    case 'invalid_userId':
      return { userId: 'invalid', description: faker.lorem.sentences(2) }
    case 'nonexistent_userId':
      return { userId: 99999, description: faker.lorem.sentences(2) }
    case 'long_description':
      return { userId: userId, description: 'a'.repeat(1001) }
    default:
      return {}
  }
}

// Lista de status válidos para tickets
const validTicketStatuses = ['Open', 'In Progress', 'Closed', 'Pending']

// Lista de status inválidos para tickets
const invalidTicketStatuses = ['', 'Invalid', 'OPEN', 'closed', 123, null]

module.exports = {
  generateUserData,
  generateTicketData,
  generateInvalidUserData,
  generateInvalidTicketData,
  validTicketStatuses,
  invalidTicketStatuses
}
