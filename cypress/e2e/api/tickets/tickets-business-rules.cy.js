// cypress/e2e/api/tickets/tickets-business-rules.cy.js

describe('API Tickets - Regras de Negócio', () => {
  
  let userId, user2Id, user3Id

  beforeEach(() => {
    // Limpa dados e cria usuários para os testes
    cy.cleanupData()
    
    // Cria usuário principal
    cy.createUserAndGetId().then((id) => {
      userId = id
    })

    // Cria usuários adicionais para testes
    cy.createUser({ name: 'User 2', email: 'user2@test.com' }).then((response) => {
      user2Id = response.body.id
    })

    cy.createUser({ name: 'User 3', email: 'user3@test.com' }).then((response) => {
      user3Id = response.body.id
    })
  })

  after(() => {
    // Limpa dados após todos os testes
    cy.cleanupData()
  })

  describe('Regra: Relacionamento com Usuários', () => {
    it('Ticket deve referenciar usuário existente na criação', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket com usuário válido'
      }

      cy.createTicket(ticketData).then((response) => {
        expect(response.status).to.eq(201)
        expect(response.body.userId).to.eq(userId)

        // Verifica se o usuário realmente existe
        cy.getUserById(userId).then((userResponse) => {
          expect(userResponse.status).to.eq(200)
          expect(userResponse.body.id).to.eq(userId)
        })
      })
    })

    it('Não deve permitir ticket para usuário inexistente', () => {
      const ticketData = {
        userId: 99999,
        description: 'Ticket para usuário inexistente'
      }

      cy.createTicket(ticketData).then((response) => {
        expect(response.status).to.eq(404)
        expect(response.body.error).to.eq('User not found.')
      })
    })

    it('Deve permitir múltiplos tickets para o mesmo usuário', () => {
      const tickets = [
        { userId: userId, description: 'Primeiro ticket do usuário' },
        { userId: userId, description: 'Segundo ticket do usuário' },
        { userId: userId, description: 'Terceiro ticket do usuário' }
      ]

      tickets.forEach((ticketData, index) => {
        cy.createTicket(ticketData).then((response) => {
          expect(response.status).to.eq(201)
          expect(response.body.userId).to.eq(userId)
          expect(response.body.id).to.eq(index + 1)
          expect(response.body.description).to.eq(ticketData.description)
        })
      })
    })

    it('Deve permitir tickets para diferentes usuários', () => {
      const tickets = [
        { userId: userId, description: 'Ticket do usuário 1' },
        { userId: user2Id, description: 'Ticket do usuário 2' },
        { userId: user3Id, description: 'Ticket do usuário 3' }
      ]

      tickets.forEach((ticketData) => {
        cy.createTicket(ticketData).then((response) => {
          expect(response.status).to.eq(201)
          expect(response.body.userId).to.eq(ticketData.userId)
          expect(response.body.description).to.eq(ticketData.description)
        })
      })
    })

    it('Ticket deve manter referência mesmo se usuário for deletado', () => {
      // Cria usuário temporário
      const tempUserData = { name: 'Temp User', email: 'temp@test.com' }
      
      cy.createUser(tempUserData).then((userResponse) => {
        const tempUserId = userResponse.body.id

        // Cria ticket para esse usuário
        const ticketData = {
          userId: tempUserId,
          description: 'Ticket que ficará órfão'
        }

        cy.createTicket(ticketData).then((ticketResponse) => {
          const ticketId = ticketResponse.body.id

          // Deleta o usuário
          cy.deleteUser(tempUserId).then(() => {
            // Ticket ainda deve existir
            cy.getTicketById(ticketId).then((getResponse) => {
              expect(getResponse.status).to.eq(200)
              expect(getResponse.body.userId).to.eq(tempUserId) // Referência mantida
              expect(getResponse.body.description).to.eq(ticketData.description)
            })
          })
        })
      })
    })
  })

  describe('Regra: Geração Automática de ID', () => {
    it('Deve gerar IDs sequenciais', () => {
      const tickets = [
        { userId: userId, description: 'Ticket 1' },
        { userId: userId, description: 'Ticket 2' },
        { userId: userId, description: 'Ticket 3' }
      ]

      tickets.forEach((ticketData, index) => {
        cy.createTicket(ticketData).then((response) => {
          expect(response.status).to.eq(201)
          expect(response.body.id).to.eq(index + 1)
        })
      })
    })

    it('Deve manter sequência mesmo com deleções', () => {
      const ticket1 = { userId: userId, description: 'Ticket 1' }
      const ticket2 = { userId: userId, description: 'Ticket 2' }
      const ticket3 = { userId: userId, description: 'Ticket 3' }

      // Cria três tickets
      cy.createTicket(ticket1).then((response1) => {
        expect(response1.body.id).to.eq(1)

        cy.createTicket(ticket2).then((response2) => {
          expect(response2.body.id).to.eq(2)

          // Deleta o segundo ticket
          cy.deleteTicket(2).then(() => {
            // Cria terceiro ticket - deve ter ID 3
            cy.createTicket(ticket3).then((response3) => {
              expect(response3.body.id).to.eq(3)
            })
          })
        })
      })
    })

    it('ID deve ser número inteiro positivo', () => {
      const ticketData = {
        userId: userId,
        description: 'Teste de ID'
      }

      cy.createTicket(ticketData).then((response) => {
        expect(response.status).to.eq(201)
        expect(response.body.id).to.be.a('number')
        expect(response.body.id).to.be.greaterThan(0)
        expect(Number.isInteger(response.body.id)).to.be.true
      })
    })
  })

  describe('Regra: Status Padrão e Transições', () => {
    it('Ticket deve ser criado com status "Open"', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para verificar status padrão'
      }

      cy.createTicket(ticketData).then((response) => {
        expect(response.status).to.eq(201)
        expect(response.body.status).to.eq('Open')
      })
    })

    it('Deve permitir todas as transições de status válidas', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para testar transições'
      }

      cy.createTicket(ticketData).then((response) => {
        const ticketId = response.body.id
        expect(response.body.status).to.eq('Open')

        // Open -> In Progress
        cy.updateTicketStatus(ticketId, 'In Progress').then((response1) => {
          expect(response1.status).to.eq(200)
          expect(response1.body.ticket.status).to.eq('In Progress')
        })

        // In Progress -> Pending
        cy.updateTicketStatus(ticketId, 'Pending').then((response2) => {
          expect(response2.status).to.eq(200)
          expect(response2.body.ticket.status).to.eq('Pending')
        })

        // Pending -> Closed
        cy.updateTicketStatus(ticketId, 'Closed').then((response3) => {
          expect(response3.status).to.eq(200)
          expect(response3.body.ticket.status).to.eq('Closed')
        })

        // Closed -> Open (reabertura)
        cy.updateTicketStatus(ticketId, 'Open').then((response4) => {
          expect(response4.status).to.eq(200)
          expect(response4.body.ticket.status).to.eq('Open')
        })
      })
    })

    it('Deve aceitar status válidos em qualquer ordem', () => {
      const validStatuses = ['Open', 'In Progress', 'Pending', 'Closed']
      const ticketData = {
        userId: userId,
        description: 'Ticket para testar todos os status'
      }

      cy.createTicket(ticketData).then((response) => {
        const ticketId = response.body.id

        validStatuses.forEach((status) => {
          cy.updateTicketStatus(ticketId, status).then((updateResponse) => {
            expect(updateResponse.status).to.eq(200)
            expect(updateResponse.body.ticket.status).to.eq(status)
          })
        })
      })
    })

    it('Atualmente aceita status inválidos (problema na API)', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para testar status inválidos'
      }

      cy.createTicket(ticketData).then((response) => {
        const ticketId = response.body.id
        
        // Status inválidos que a API atualmente aceita (mas não deveria)
        const invalidStatuses = ['OPEN', 'closed', 'Invalid', 'Random Status']

        invalidStatuses.forEach((status) => {
          cy.updateTicketStatus(ticketId, status).then((updateResponse) => {
            // Atualmente aceita (mas deveria rejeitar)
            expect(updateResponse.status).to.eq(200)
            expect(updateResponse.body.ticket.status).to.eq(status)
          })
        })
      })
    })
  })

  describe('Regra: Timestamp de Criação', () => {
    it('Deve gerar timestamp automático na criação', () => {
      const beforeCreation = new Date()
      
      const ticketData = {
        userId: userId,
        description: 'Ticket para verificar timestamp'
      }

      cy.createTicket(ticketData).then((response) => {
        expect(response.status).to.eq(201)
        expect(response.body).to.have.property('createdAt')
        expect(response.body.createdAt).to.be.a('string')

        const createdAt = new Date(response.body.createdAt)
        const afterCreation = new Date()

        // Timestamp deve estar entre o início e fim do teste
        expect(createdAt.getTime()).to.be.greaterThan(beforeCreation.getTime() - 1000)
        expect(createdAt.getTime()).to.be.lessThan(afterCreation.getTime() + 1000)

        // Deve estar no formato ISO 8601
        expect(response.body.createdAt).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      })
    })

    it('Timestamp deve ser imutável', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para verificar imutabilidade do timestamp'
      }

      cy.createTicket(ticketData).then((response) => {
        const ticketId = response.body.id
        const originalTimestamp = response.body.createdAt

        // Aguarda um pouco e atualiza status
        cy.wait(100)
        cy.updateTicketStatus(ticketId, 'In Progress').then((updateResponse) => {
          expect(updateResponse.body.ticket.createdAt).to.eq(originalTimestamp)
        })

        // Verifica novamente com busca
        cy.getTicketById(ticketId).then((getResponse) => {
          expect(getResponse.body.createdAt).to.eq(originalTimestamp)
        })
      })
    })

    it('Tickets criados em sequência devem ter timestamps diferentes', () => {
      const ticket1Data = { userId: userId, description: 'Ticket 1' }
      const ticket2Data = { userId: userId, description: 'Ticket 2' }

      cy.createTicket(ticket1Data).then((response1) => {
        const timestamp1 = new Date(response1.body.createdAt)

        // Aguarda um milissegundo para garantir timestamp diferente
        cy.wait(1)

        cy.createTicket(ticket2Data).then((response2) => {
          const timestamp2 = new Date(response2.body.createdAt)

          expect(timestamp2.getTime()).to.be.greaterThan(timestamp1.getTime())
        })
      })
    })
  })

  describe('Regra: Imutabilidade de Campos', () => {
    it('ID não deve ser alterável', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para testar imutabilidade do ID'
      }

      cy.createTicket(ticketData).then((response) => {
        const originalId = response.body.id

        // Tenta alterar via atualização de status
        cy.request({
          method: 'PUT',
          url: `/tickets/${originalId}/status`,
          body: { status: 'In Progress', id: 999 },
          failOnStatusCode: false
        }).then((updateResponse) => {
          expect(updateResponse.status).to.eq(200)
          expect(updateResponse.body.ticket.id).to.eq(originalId) // ID mantido
        })
      })
    })

    it('UserId não deve ser alterável via atualização de status', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para testar imutabilidade do userId'
      }

      cy.createTicket(ticketData).then((response) => {
        const ticketId = response.body.id

        // Tenta alterar userId via atualização de status
        cy.request({
          method: 'PUT',
          url: `/tickets/${ticketId}/status`,
          body: { status: 'In Progress', userId: user2Id },
          failOnStatusCode: false
        }).then((updateResponse) => {
          expect(updateResponse.status).to.eq(200)
          expect(updateResponse.body.ticket.userId).to.eq(userId) // UserId mantido
        })
      })
    })

    it('Descrição não deve ser alterável via atualização de status', () => {
      const originalDescription = 'Descrição original do ticket'
      const ticketData = {
        userId: userId,
        description: originalDescription
      }

      cy.createTicket(ticketData).then((response) => {
        const ticketId = response.body.id

        // Tenta alterar descrição via atualização de status
        cy.request({
          method: 'PUT',
          url: `/tickets/${ticketId}/status`,
          body: { status: 'In Progress', description: 'Nova descrição' },
          failOnStatusCode: false
        }).then((updateResponse) => {
          expect(updateResponse.status).to.eq(200)
          expect(updateResponse.body.ticket.description).to.eq(originalDescription) // Descrição mantida
        })
      })
    })
  })

  describe('Regra: Campos Obrigatórios', () => {
    it('UserId e description são obrigatórios para criação', () => {
      const invalidCases = [
        { data: {}, description: 'dados vazios' },
        { data: { userId: userId }, description: 'apenas userId' },
        { data: { description: 'Teste' }, description: 'apenas description' },
        { data: { userId: '', description: 'Teste' }, description: 'userId vazio' },
        { data: { userId: userId, description: '' }, description: 'description vazia' },
        { data: { userId: null, description: 'Teste' }, description: 'userId null' },
        { data: { userId: userId, description: null }, description: 'description null' }
      ]

      invalidCases.forEach(testCase => {
        cy.createTicket(testCase.data).then((response) => {
          expect(response.status).to.eq(400)
          expect(response.body.error).to.include('required')
          cy.task('log', `Teste ${testCase.description}: PASSOU`)
        })
      })
    })

    it('Status é obrigatório para atualização', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para testar status obrigatório'
      }

      cy.createTicket(ticketData).then((response) => {
        const ticketId = response.body.id

        const invalidStatusCases = [
          { body: {}, description: 'body vazio' },
          { body: { status: '' }, description: 'status vazio' },
          { body: { status: null }, description: 'status null' }
        ]

        invalidStatusCases.forEach(testCase => {
          cy.request({
            method: 'PUT',
            url: `/tickets/${ticketId}/status`,
            body: testCase.body,
            failOnStatusCode: false
          }).then((updateResponse) => {
            expect(updateResponse.status).to.eq(400)
            expect(updateResponse.body.error).to.eq('Status is required.')
          })
        })
      })
    })
  })

  describe('Regra: Integridade de Dados', () => {
    it('Dados devem permanecer consistentes após operações', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para verificar integridade'
      }

      cy.createTicket(ticketData).then((createResponse) => {
        const ticketId = createResponse.body.id
        const originalTicket = createResponse.body

        // Atualiza status
        cy.updateTicketStatus(ticketId, 'In Progress').then((updateResponse) => {
          const updatedTicket = updateResponse.body.ticket

          // Verifica integridade
          expect(updatedTicket.id).to.eq(originalTicket.id)
          expect(updatedTicket.userId).to.eq(originalTicket.userId)
          expect(updatedTicket.description).to.eq(originalTicket.description)
          expect(updatedTicket.createdAt).to.eq(originalTicket.createdAt)
          expect(updatedTicket.status).to.eq('In Progress') // Apenas status mudou

          // Busca para confirmar
          cy.getTicketById(ticketId).then((getResponse) => {
            expect(getResponse.body).to.deep.eq(updatedTicket)
          })
        })
      })
    })

    it('Deve manter dados corretos mesmo com operações simultâneas', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para teste de concorrência'
      }

      cy.createTicket(ticketData).then((response) => {
        const ticketId = response.body.id

        // Múltiplas atualizações de status em paralelo
        const statusUpdates = ['In Progress', 'Pending', 'Closed']
        
        statusUpdates.forEach((status) => {
          cy.updateTicketStatus(ticketId, status)
        })

        // Verifica estado final
        cy.getTicketById(ticketId).then((getResponse) => {
          expect(getResponse.status).to.eq(200)
          expect(statusUpdates).to.include(getResponse.body.status)
        })
      })
    })
  })
})
