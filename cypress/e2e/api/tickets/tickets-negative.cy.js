// cypress/e2e/api/tickets/tickets-negative.cy.js

describe('API Tickets - Cenários Negativos', () => {
  
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

  describe('POST /tickets - Criar Ticket (Casos Negativos)', () => {
    it('Deve retornar erro 400 quando userId não é fornecido', () => {
      const ticketData = { description: 'Ticket sem userId' }

      cy.createTicket(ticketData).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body).to.have.property('error')
        expect(response.body.error).to.eq('The fields userId and description are required.')
        cy.validateErrorSchema(response.body)
      })
    })

    it('Deve retornar erro 400 quando description não é fornecida', () => {
      const ticketData = { userId: userId }

      cy.createTicket(ticketData).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body).to.have.property('error')
        expect(response.body.error).to.eq('The fields userId and description are required.')
        cy.validateErrorSchema(response.body)
      })
    })

    it('Deve retornar erro 400 quando description é string vazia', () => {
      const ticketData = { userId: userId, description: '' }

      cy.createTicket(ticketData).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body).to.have.property('error')
        expect(response.body.error).to.eq('The fields userId and description are required.')
      })
    })

    it('Deve retornar erro 400 quando ambos os campos estão vazios', () => {
      const ticketData = { userId: '', description: '' }

      cy.createTicket(ticketData).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body).to.have.property('error')
        cy.validateErrorSchema(response.body)
      })
    })

    it('Deve retornar erro 404 quando userId não existe', () => {
      const ticketData = {
        userId: 99999,
        description: 'Ticket com usuário inexistente'
      }

      cy.createTicket(ticketData).then((response) => {
        expect(response.status).to.eq(404)
        expect(response.body).to.have.property('error')
        expect(response.body.error).to.eq('User not found.')
        cy.validateErrorSchema(response.body)
      })
    })

    it('Deve retornar erro 404 quando userId é negativo', () => {
      const ticketData = {
        userId: -1,
        description: 'Ticket com userId negativo'
      }

      cy.createTicket(ticketData).then((response) => {
        expect(response.status).to.eq(404)
        expect(response.body.error).to.eq('User not found.')
      })
    })

    it('Deve retornar erro 404 quando userId é zero', () => {
      const ticketData = {
        userId: 0,
        description: 'Ticket com userId zero'
      }

      cy.createTicket(ticketData).then((response) => {
        expect(response.status).to.eq(404)
        expect(response.body.error).to.eq('User not found.')
      })
    })

    it('Deve rejeitar userId como string', () => {
      const ticketData = {
        userId: 'invalid',
        description: 'Ticket com userId string'
      }

      cy.createTicket(ticketData).then((response) => {
        expect(response.status).to.eq(404)
        expect(response.body.error).to.eq('User not found.')
      })
    })

    it('Deve rejeitar body vazio', () => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/tickets`,
        body: {},
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400)
        cy.validateErrorSchema(response.body)
      })
    })

    it('Deve rejeitar campos null', () => {
      const ticketData = {
        userId: null,
        description: null
      }

      cy.createTicket(ticketData).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body.error).to.eq('The fields userId and description are required.')
      })
    })

    it('Deve ignorar campos extras no body', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket com campos extras',
        extraField: 'não deveria aceitar',
        id: 999,
        status: 'Custom Status',
        createdAt: '2023-01-01T00:00:00.000Z'
      }

      cy.createTicket(ticketData).then((response) => {
        expect(response.status).to.eq(201)
        // Campos devem ser gerados automaticamente
        expect(response.body.id).to.not.eq(999)
        expect(response.body.status).to.eq('Open') // Status padrão
        expect(response.body.createdAt).to.not.eq('2023-01-01T00:00:00.000Z')
        // Campo extra não deve aparecer
        expect(response.body).to.not.have.property('extraField')
      })
    })

    it('Deve falhar quando usuário é deletado após verificação inicial', () => {
      // Cria usuário temporário
      const tempUserData = { name: 'Temp User', email: 'temp@test.com' }
      
      cy.createUser(tempUserData).then((userResponse) => {
        const tempUserId = userResponse.body.id

        // Deleta o usuário
        cy.deleteUser(tempUserId).then(() => {
          // Tenta criar ticket com usuário deletado
          const ticketData = {
            userId: tempUserId,
            description: 'Ticket com usuário deletado'
          }

          cy.createTicket(ticketData).then((response) => {
            expect(response.status).to.eq(404)
            expect(response.body.error).to.eq('User not found.')
          })
        })
      })
    })
  })

  describe('GET /tickets/:id - Buscar Ticket (Casos Negativos)', () => {
    it('Deve retornar erro 404 para ticket inexistente', () => {
      cy.getTicketById(999).then((response) => {
        expect(response.status).to.eq(404)
        expect(response.body).to.have.property('error')
        expect(response.body.error).to.eq('Ticket not found.')
        cy.validateErrorSchema(response.body)
      })
    })

    it('Deve retornar erro 404 para ID negativo', () => {
      cy.getTicketById(-1).then((response) => {
        expect(response.status).to.eq(404)
        expect(response.body.error).to.eq('Ticket not found.')
      })
    })

    it('Deve retornar erro 404 para ID zero', () => {
      cy.getTicketById(0).then((response) => {
        expect(response.status).to.eq(404)
        expect(response.body.error).to.eq('Ticket not found.')
      })
    })

    it('Deve tratar ID string como não encontrado', () => {
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/tickets/abc`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(404)
        cy.validateErrorSchema(response.body)
      })
    })

    it('Deve retornar erro para ID muito grande', () => {
      cy.getTicketById(999999999).then((response) => {
        expect(response.status).to.eq(404)
        expect(response.body.error).to.eq('Ticket not found.')
      })
    })
  })

  describe('PUT /tickets/:id/status - Atualizar Status (Casos Negativos)', () => {
    it('Deve retornar erro 404 para ticket inexistente', () => {
      cy.updateTicketStatus(999, 'In Progress').then((response) => {
        expect(response.status).to.eq(404)
        expect(response.body).to.have.property('error')
        expect(response.body.error).to.eq('Ticket not found.')
        cy.validateErrorSchema(response.body)
      })
    })

    it('Deve retornar erro 400 quando status não é fornecido', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para teste de status vazio'
      }

      cy.createTicket(ticketData).then((createResponse) => {
        const ticketId = createResponse.body.id

        cy.request({
          method: 'PUT',
          url: `/tickets/${ticketId}/status`,
          body: {},
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(400)
          expect(response.body.error).to.eq('Status is required.')
          cy.validateErrorSchema(response.body)
        })
      })
    })

    it('Deve retornar erro 400 quando status é string vazia', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para teste de status vazio'
      }

      cy.createTicket(ticketData).then((createResponse) => {
        const ticketId = createResponse.body.id

        cy.updateTicketStatus(ticketId, '').then((response) => {
          expect(response.status).to.eq(400)
          expect(response.body.error).to.eq('Status is required.')
        })
      })
    })

    it('Deve aceitar status inválido (problema na API)', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para teste de status inválido'
      }

      cy.createTicket(ticketData).then((createResponse) => {
        const ticketId = createResponse.body.id

        // A API atualmente aceita qualquer status
        const invalidStatuses = ['Invalid Status', 'OPEN', 'closed', 'random']

        invalidStatuses.forEach(status => {
          cy.updateTicketStatus(ticketId, status).then((response) => {
            // Atualmente a API aceita (mas deveria rejeitar)
            expect(response.status).to.eq(200)
            expect(response.body.ticket.status).to.eq(status)
          })
        })
      })
    })

    it('Deve retornar erro 400 quando status é null', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para teste de status null'
      }

      cy.createTicket(ticketData).then((createResponse) => {
        const ticketId = createResponse.body.id

        cy.request({
          method: 'PUT',
          url: `/tickets/${ticketId}/status`,
          body: { status: null },
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(400)
          expect(response.body.error).to.eq('Status is required.')
        })
      })
    })

    it('Deve aceitar status numérico (problema na API)', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para teste de status numérico'
      }

      cy.createTicket(ticketData).then((createResponse) => {
        const ticketId = createResponse.body.id

        cy.request({
          method: 'PUT',
          url: `/tickets/${ticketId}/status`,
          body: { status: 123 },
          failOnStatusCode: false
        }).then((response) => {
          // A API atualmente aceita números (mas deveria rejeitar)
          expect(response.status).to.eq(200)
          expect(response.body.ticket.status).to.eq(123)
        })
      })
    })

    it('Deve ignorar campos extras na atualização de status', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para teste de campos extras'
      }

      cy.createTicket(ticketData).then((createResponse) => {
        const ticketId = createResponse.body.id
        const originalTicket = createResponse.body

        cy.request({
          method: 'PUT',
          url: `/tickets/${ticketId}/status`,
          body: {
            status: 'In Progress',
            description: 'Nova descrição',
            userId: 999,
            id: 888
          },
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(200)
          
          const updatedTicket = response.body.ticket
          expect(updatedTicket.status).to.eq('In Progress')
          // Outros campos devem permanecer inalterados
          expect(updatedTicket.description).to.eq(originalTicket.description)
          expect(updatedTicket.userId).to.eq(originalTicket.userId)
          expect(updatedTicket.id).to.eq(originalTicket.id)
        })
      })
    })
  })

  describe('DELETE /tickets/:id - Deletar Ticket (Casos Negativos)', () => {
    it('Deve retornar erro 404 para ticket inexistente', () => {
      cy.deleteTicket(999).then((response) => {
        expect(response.status).to.eq(404)
        expect(response.body).to.have.property('error')
        expect(response.body.error).to.eq('Ticket not found.')
        cy.validateErrorSchema(response.body)
      })
    })

    it('Deve retornar erro 404 ao tentar deletar ticket já deletado', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para deletar duas vezes'
      }

      cy.createTicket(ticketData).then((createResponse) => {
        const ticketId = createResponse.body.id

        // Primeira deleção deve funcionar
        cy.deleteTicket(ticketId).then((response) => {
          expect(response.status).to.eq(200)
        })

        // Segunda deleção deve falhar
        cy.deleteTicket(ticketId).then((secondResponse) => {
          expect(secondResponse.status).to.eq(404)
          expect(secondResponse.body.error).to.eq('Ticket not found.')
        })
      })
    })

    it('Deve retornar erro 404 para ID negativo', () => {
      cy.deleteTicket(-1).then((response) => {
        expect(response.status).to.eq(404)
        expect(response.body.error).to.eq('Ticket not found.')
      })
    })

    it('Deve retornar erro 404 para ID zero', () => {
      cy.deleteTicket(0).then((response) => {
        expect(response.status).to.eq(404)
        expect(response.body.error).to.eq('Ticket not found.')
      })
    })
  })

  describe('Métodos HTTP Inválidos', () => {
    it('Deve retornar erro 405 para método PATCH em /tickets/:id', () => {
      cy.request({
        method: 'PATCH',
        url: `${Cypress.env('apiUrl')}/tickets/1`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(405)
        expect(response.body.error).to.eq('Invalid request method.')
      })
    })

    it('Deve retornar erro 405 para método POST em /tickets/:id', () => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/tickets/1`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(405)
        expect(response.body.error).to.eq('Invalid request method.')
      })
    })
  })

  describe('Teste de Relacionamento com Usuários', () => {
    it('Não deve permitir criar ticket para usuário que não existe', () => {
      // Verifica se usuário não existe
      cy.getUserById(99999).then((userResponse) => {
        expect(userResponse.status).to.eq(404)

        // Tenta criar ticket para usuário inexistente
        const ticketData = {
          userId: 99999,
          description: 'Ticket para usuário inexistente'
        }

        cy.createTicket(ticketData).then((ticketResponse) => {
          expect(ticketResponse.status).to.eq(404)
          expect(ticketResponse.body.error).to.eq('User not found.')
        })
      })
    })

    it('Ticket deve manter referência mesmo se usuário for deletado posteriormente', () => {
      // Cria usuário temporário
      const tempUserData = { name: 'Temp User', email: 'temp@test.com' }
      
      cy.createUser(tempUserData).then((userResponse) => {
        const tempUserId = userResponse.body.id

        // Cria ticket para esse usuário
        const ticketData = {
          userId: tempUserId,
          description: 'Ticket que ficará órfão'
        }

        cy.createTicket(ticketData).then((createResponse) => {
          const ticketId = createResponse.body.id

          // Deleta o usuário
          cy.deleteUser(tempUserId).then(() => {
            // Ticket ainda deve existir e ser acessível
            cy.getTicketById(ticketId).then((getResponse) => {
              expect(getResponse.status).to.eq(200)
              expect(getResponse.body.userId).to.eq(tempUserId) // Referência mantida
              expect(getResponse.body.description).to.eq(ticketData.description)
            })

            // Deve permitir atualizar status do ticket órfão
            cy.updateTicketStatus(ticketId, 'Closed').then((updateResponse) => {
              expect(updateResponse.status).to.eq(200)
            })

            // Deve permitir deletar ticket órfão
            cy.deleteTicket(ticketId).then((deleteResponse) => {
              expect(deleteResponse.status).to.eq(200)
            })
          })
        })
      })
    })
  })

  describe('Validações de Content-Type', () => {
    it('Deve aceitar application/json', () => {
      const ticketData = {
        userId: userId,
        description: 'Teste de content-type'
      }

      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/tickets`,
        headers: {
          'Content-Type': 'application/json'
        },
        body: ticketData,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(201)
      })
    })

    it('Deve processar requisição sem Content-Type', () => {
      const ticketData = {
        userId: userId,
        description: 'Teste sem content-type'
      }

      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/tickets`,
        body: ticketData,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(201)
      })
    })
  })
})
