// cypress/e2e/api/tickets/tickets-positive.cy.js

describe('API Tickets - Cenários Positivos', () => {
  
  let userId

  beforeEach(() => {
    // Limpa dados e cria um usuário para os testes
    cy.cleanupData()
    cy.createUserAndGetId().then((id) => {
      userId = id
    })
  })

  after(() => {
    // Limpa dados após todos os testes
    cy.cleanupData()
  })

  describe('POST /tickets - Criar Ticket', () => {
    it('Deve criar um ticket com dados válidos', () => {
      const ticketData = {
        userId: userId,
        description: 'Sistema apresentando lentidão na interface principal'
      }

      cy.createTicket(ticketData).then((response) => {
        // Validações de status e estrutura
        expect(response.status).to.eq(201)
        expect(response.body).to.have.property('id')
        expect(response.body.id).to.be.a('number')
        expect(response.body.userId).to.eq(ticketData.userId)
        expect(response.body.description).to.eq(ticketData.description)
        expect(response.body.status).to.eq('Open') // Status padrão
        expect(response.body).to.have.property('createdAt')
        expect(response.body.createdAt).to.be.a('string')

        // Validação de schema
        cy.validateTicketSchema(response.body)

        // Validação do formato da data
        const createdAt = new Date(response.body.createdAt)
        expect(createdAt.toString()).to.not.eq('Invalid Date')
      })
    })

    it('Deve criar múltiplos tickets para o mesmo usuário', () => {
      const tickets = [
        { userId: userId, description: 'Problema 1: Sistema lento' },
        { userId: userId, description: 'Problema 2: Erro no login' },
        { userId: userId, description: 'Problema 3: Falha no envio de email' }
      ]

      tickets.forEach((ticketData, index) => {
        cy.createTicket(ticketData).then((response) => {
          expect(response.status).to.eq(201)
          expect(response.body.id).to.eq(index + 1)
          expect(response.body.userId).to.eq(userId)
          expect(response.body.description).to.eq(ticketData.description)
          expect(response.body.status).to.eq('Open')
        })
      })
    })

    it('Deve criar tickets para diferentes usuários', () => {
      // Cria usuários adicionais
      const user2Data = { name: 'User 2', email: 'user2@test.com' }
      const user3Data = { name: 'User 3', email: 'user3@test.com' }

      cy.createUser(user2Data).then((user2Response) => {
        const user2Id = user2Response.body.id

        cy.createUser(user3Data).then((user3Response) => {
          const user3Id = user3Response.body.id

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
      })
    })

    it('Deve gerar ID sequencial para novos tickets', () => {
      const ticket1 = { userId: userId, description: 'Primeiro ticket' }
      const ticket2 = { userId: userId, description: 'Segundo ticket' }

      cy.createTicket(ticket1).then((response1) => {
        expect(response1.body.id).to.eq(1)
        
        cy.createTicket(ticket2).then((response2) => {
          expect(response2.body.id).to.eq(2)
        })
      })
    })

    it('Deve definir status padrão como "Open"', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para verificar status padrão'
      }

      cy.createTicket(ticketData).then((response) => {
        expect(response.status).to.eq(201)
        expect(response.body.status).to.eq('Open')
      })
    })

    it('Deve gerar timestamp de criação válido', () => {
      const beforeCreation = new Date()
      
      const ticketData = {
        userId: userId,
        description: 'Ticket para verificar timestamp'
      }

      cy.createTicket(ticketData).then((response) => {
        expect(response.status).to.eq(201)
        
        const createdAt = new Date(response.body.createdAt)
        const afterCreation = new Date()
        
        // Timestamp deve estar entre o início e fim do teste
        expect(createdAt.getTime()).to.be.greaterThan(beforeCreation.getTime() - 1000)
        expect(createdAt.getTime()).to.be.lessThan(afterCreation.getTime() + 1000)
      })
    })
  })

  describe('GET /tickets/:id - Buscar Ticket por ID', () => {
    it('Deve retornar ticket específico por ID', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para busca por ID'
      }
      
      cy.createTicket(ticketData).then((createResponse) => {
        const ticketId = createResponse.body.id

        cy.getTicketById(ticketId).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body.id).to.eq(ticketId)
          expect(response.body.userId).to.eq(ticketData.userId)
          expect(response.body.description).to.eq(ticketData.description)
          expect(response.body.status).to.eq('Open')
          expect(response.body).to.have.property('createdAt')

          // Validação de schema
          cy.validateTicketSchema(response.body)
        })
      })
    })

    it('Deve buscar tickets com IDs diferentes', () => {
      const tickets = [
        { userId: userId, description: 'Ticket 1 para busca' },
        { userId: userId, description: 'Ticket 2 para busca' }
      ]

      tickets.forEach((ticketData, index) => {
        cy.createTicket(ticketData).then((createResponse) => {
          const ticketId = createResponse.body.id

          cy.getTicketById(ticketId).then((getResponse) => {
            expect(getResponse.status).to.eq(200)
            expect(getResponse.body.id).to.eq(ticketId)
            expect(getResponse.body.description).to.eq(ticketData.description)
          })
        })
      })
    })
  })

  describe('PUT /tickets/:id/status - Atualizar Status do Ticket', () => {
    it('Deve atualizar status para "In Progress"', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para atualização de status'
      }

      cy.createTicket(ticketData).then((createResponse) => {
        const ticketId = createResponse.body.id

        cy.updateTicketStatus(ticketId, 'In Progress').then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body.message).to.eq('Ticket status updated successfully.')
          expect(response.body.ticket.id).to.eq(ticketId)
          expect(response.body.ticket.status).to.eq('In Progress')
          expect(response.body.ticket.description).to.eq(ticketData.description)
          expect(response.body.ticket.userId).to.eq(userId)
        })
      })
    })

    it('Deve atualizar status para "Closed"', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para fechar'
      }

      cy.createTicket(ticketData).then((createResponse) => {
        const ticketId = createResponse.body.id

        cy.updateTicketStatus(ticketId, 'Closed').then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body.ticket.status).to.eq('Closed')
        })
      })
    })

    it('Deve atualizar status para "Pending"', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para pendente'
      }

      cy.createTicket(ticketData).then((createResponse) => {
        const ticketId = createResponse.body.id

        cy.updateTicketStatus(ticketId, 'Pending').then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body.ticket.status).to.eq('Pending')
        })
      })
    })

    it('Deve permitir múltiplas atualizações de status', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para múltiplas atualizações'
      }

      cy.createTicket(ticketData).then((createResponse) => {
        const ticketId = createResponse.body.id
        const statusSequence = ['In Progress', 'Pending', 'Closed', 'Open']

        statusSequence.forEach((status) => {
          cy.updateTicketStatus(ticketId, status).then((response) => {
            expect(response.status).to.eq(200)
            expect(response.body.ticket.status).to.eq(status)
          })
        })
      })
    })

    it('Deve manter outros campos inalterados ao atualizar status', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para verificar campos inalterados'
      }

      cy.createTicket(ticketData).then((createResponse) => {
        const originalTicket = createResponse.body
        const ticketId = originalTicket.id

        cy.updateTicketStatus(ticketId, 'In Progress').then((response) => {
          expect(response.status).to.eq(200)
          
          const updatedTicket = response.body.ticket
          expect(updatedTicket.id).to.eq(originalTicket.id)
          expect(updatedTicket.userId).to.eq(originalTicket.userId)
          expect(updatedTicket.description).to.eq(originalTicket.description)
          expect(updatedTicket.createdAt).to.eq(originalTicket.createdAt)
          expect(updatedTicket.status).to.eq('In Progress') // Apenas status mudou
        })
      })
    })
  })

  describe('DELETE /tickets/:id - Deletar Ticket', () => {
    it('Deve deletar ticket existente', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para deletar'
      }

      cy.createTicket(ticketData).then((createResponse) => {
        const ticketId = createResponse.body.id

        cy.deleteTicket(ticketId).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body.message).to.eq('Ticket deleted successfully.')
          expect(response.body.ticket.id).to.eq(ticketId)
          expect(response.body.ticket.description).to.eq(ticketData.description)
          expect(response.body.ticket.userId).to.eq(userId)
        })

        // Verifica se o ticket foi realmente deletado
        cy.getTicketById(ticketId).then((getResponse) => {
          expect(getResponse.status).to.eq(404)
          cy.validateErrorSchema(getResponse.body)
        })
      })
    })

    it('Deve deletar múltiplos tickets', () => {
      const tickets = [
        { userId: userId, description: 'Ticket 1 para deletar' },
        { userId: userId, description: 'Ticket 2 para deletar' },
        { userId: userId, description: 'Ticket 3 para deletar' }
      ]

      const ticketIds = []

      // Cria tickets
      tickets.forEach(ticketData => {
        cy.createTicket(ticketData).then((response) => {
          ticketIds.push(response.body.id)
        })
      })

      // Deleta tickets
      cy.then(() => {
        ticketIds.forEach(ticketId => {
          cy.deleteTicket(ticketId).then((response) => {
            expect(response.status).to.eq(200)
            expect(response.body.message).to.eq('Ticket deleted successfully.')
          })
        })
      })

      // Verifica se todos foram deletados
      cy.then(() => {
        ticketIds.forEach(ticketId => {
          cy.getTicketById(ticketId).then((response) => {
            expect(response.status).to.eq(404)
          })
        })
      })
    })
  })

  describe('Validações de Performance', () => {
    it('Todas as operações devem ter tempo de resposta aceitável', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para teste de performance'
      }

      // CREATE - Deve ser rápido
      cy.createTicket(ticketData).then((response) => {
        expect(response.duration).to.be.lessThan(1000) // menos de 1 segundo
        
        const ticketId = response.body.id

        // READ - Deve ser muito rápido
        cy.getTicketById(ticketId).then((getResponse) => {
          expect(getResponse.duration).to.be.lessThan(500) // menos de 0.5 segundo
        })

        // UPDATE - Deve ser rápido
        cy.updateTicketStatus(ticketId, 'In Progress').then((updateResponse) => {
          expect(updateResponse.duration).to.be.lessThan(1000)
        })

        // DELETE - Deve ser rápido
        cy.deleteTicket(ticketId).then((deleteResponse) => {
          expect(deleteResponse.duration).to.be.lessThan(1000)
        })
      })
    })
  })

  describe('Testes de Integração com Usuários', () => {
    it('Deve manter referência correta ao usuário', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para verificar referência de usuário'
      }

      cy.createTicket(ticketData).then((ticketResponse) => {
        const ticketId = ticketResponse.body.id

        // Verifica se o usuário existe
        cy.getUserById(userId).then((userResponse) => {
          expect(userResponse.status).to.eq(200)

          // Verifica se o ticket referencia o usuário correto
          cy.getTicketById(ticketId).then((getTicketResponse) => {
            expect(getTicketResponse.status).to.eq(200)
            expect(getTicketResponse.body.userId).to.eq(userResponse.body.id)
          })
        })
      })
    })

    it('Deve permitir criar tickets após deletar e recriar usuário', () => {
      const originalUserData = { name: 'User Original', email: 'original@test.com' }
      
      // Deleta usuário atual
      cy.deleteUser(userId).then(() => {
        // Cria novo usuário
        cy.createUser(originalUserData).then((newUserResponse) => {
          const newUserId = newUserResponse.body.id

          const ticketData = {
            userId: newUserId,
            description: 'Ticket com novo usuário'
          }

          cy.createTicket(ticketData).then((response) => {
            expect(response.status).to.eq(201)
            expect(response.body.userId).to.eq(newUserId)
          })
        })
      })
    })
  })
})
