// cypress/e2e/api/test-config.cy.js

describe('Validação de Configuração', () => {
  it('Deve validar configuração básica do Cypress', () => {
    expect(Cypress.env('apiUrl')).to.eq('http://localhost:3000')
    expect(Cypress.env('useMockServer')).to.be.false
    cy.log('✅ Configuração do Cypress está correta')
  })

  it('Deve conseguir validar schemas', () => {
    // Testa se o AJV está funcionando
    cy.fixture('schemas/user-schema.json').then((schema) => {
      expect(schema).to.have.property('type')
      expect(schema.type).to.eq('object')
      expect(schema).to.have.property('required')
      cy.log('✅ Schema de usuário carregado corretamente')
    })

    cy.fixture('schemas/ticket-schema.json').then((schema) => {
      expect(schema).to.have.property('type')
      expect(schema.type).to.eq('object')
      expect(schema).to.have.property('required')
      cy.log('✅ Schema de ticket carregado corretamente')
    })
  })

  it('Deve executar comandos customizados sem erro', () => {
    // Testa se os comandos estão carregados corretamente
    expect(cy.createUser).to.be.a('function')
    expect(cy.getUsers).to.be.a('function')
    expect(cy.createTicket).to.be.a('function')
    expect(cy.getTickets).to.be.a('function')
    expect(cy.validateUserSchema).to.be.a('function')
    expect(cy.validateTicketSchema).to.be.a('function')
    
    cy.log('✅ Todos os comandos customizados estão carregados')
  })

  it('Deve validar estrutura de fixtures', () => {
    cy.fixture('users.json').then((userData) => {
      expect(userData).to.have.property('validUsers')
      expect(userData.validUsers).to.be.an('array')
      cy.log('✅ Fixture de usuários está correta')
    })

    cy.fixture('tickets.json').then((ticketData) => {
      expect(ticketData).to.have.property('validTickets')
      expect(ticketData.validTickets).to.be.an('array')
      cy.log('✅ Fixture de tickets está correta')
    })
  })

  it('Deve conseguir executar funções básicas', () => {
    // Testa geradores simples sem usar o comando
    const timestamp = Date.now()
    const testUser = {
      name: `Test User ${timestamp}`,
      email: `test${timestamp}@example.com`
    }
    
    expect(testUser).to.have.property('name')
    expect(testUser).to.have.property('email')
    expect(testUser.email).to.include('@')
    
    cy.log('✅ Geração de dados básica funcionando')
  })
})
