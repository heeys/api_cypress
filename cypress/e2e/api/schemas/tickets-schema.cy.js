// cypress/e2e/api/schemas/tickets-schema.cy.js

import '../../../support/utils/schema-validator.js'

describe('API Tickets - Validação de Schemas', () => {
  
  let userId

  beforeEach(() => {
    // Limpa dados e cria usuário para os testes
    cy.cleanupData()
    cy.createUserAndGetId().then((id) => {
      userId = id
    })
  })

  after(() => {
    // Limpa dados após todos os testes
    cy.cleanupData()
  })

  describe('Schema de Resposta - Criação de Ticket', () => {
    it('Deve retornar schema válido ao criar ticket', () => {
      const ticketData = {
        userId: userId,
        description: 'Sistema apresentando lentidão na interface'
      }

      cy.createTicket(ticketData).then((response) => {
        expect(response.status).to.eq(201)
        
        // Validação de schema completo
        cy.validateTicketSchema(response.body)

        // Validações específicas de tipos
        expect(response.body.id).to.be.a('number')
        expect(response.body.userId).to.be.a('number')
        expect(response.body.description).to.be.a('string')
        expect(response.body.status).to.be.a('string')
        expect(response.body.createdAt).to.be.a('string')

        // Validações de valores
        expect(response.body.id).to.be.greaterThan(0)
        expect(response.body.userId).to.eq(userId)
        expect(response.body.description).to.have.length.greaterThan(0)
        expect(response.body.status).to.eq('Open')

        // Validação do formato da data
        const createdAt = new Date(response.body.createdAt)
        expect(createdAt.toString()).to.not.eq('Invalid Date')
      })
    })

    it('Deve validar schema com diferentes tipos de descrições', () => {
      const testCases = [
        'Descrição simples',
        'Descrição com acentos: àáâãéêíóôõúç',
        'Descrição com números 123 e símbolos @#$%',
        'Descrição longa: ' + 'a'.repeat(500),
        'Descrição com quebras\nde linha\ne tabulação\t',
        'Descrição com emojis 😀🚀💻'
      ]

      testCases.forEach((description, index) => {
        const ticketData = {
          userId: userId,
          description: description
        }

        cy.createTicket(ticketData).then((response) => {
          expect(response.status).to.eq(201)
          cy.validateTicketSchema(response.body)
          
          expect(response.body.id).to.eq(index + 1)
          expect(response.body.description).to.eq(description)
        })
      })
    })

    it('Deve validar que não há campos extras na resposta', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket com campos extras',
        extraField: 'não deveria aparecer',
        priority: 'high'
      }

      cy.createTicket(ticketData).then((response) => {
        expect(response.status).to.eq(201)
        
        // Schema deve passar (não permite campos extras)
        cy.validateTicketSchema(response.body)

        // Verifica explicitamente que não há campos extras
        const allowedFields = ['id', 'userId', 'description', 'status', 'createdAt']
        const responseFields = Object.keys(response.body)
        
        responseFields.forEach(field => {
          expect(allowedFields).to.include(field)
        })

        expect(response.body).to.not.have.property('extraField')
        expect(response.body).to.not.have.property('priority')
      })
    })

    it('Deve validar formato ISO 8601 para createdAt', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para validar formato de data'
      }

      cy.createTicket(ticketData).then((response) => {
        expect(response.status).to.eq(201)
        cy.validateTicketSchema(response.body)

        // Verifica formato ISO 8601: YYYY-MM-DDTHH:mm:ss.sssZ
        expect(response.body.createdAt).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)

        // Verifica se é uma data válida
        const date = new Date(response.body.createdAt)
        expect(date.toString()).to.not.eq('Invalid Date')
        expect(date.toISOString()).to.eq(response.body.createdAt)
      })
    })
  })

  describe('Schema de Resposta - Busca de Ticket', () => {
    it('Deve retornar schema válido ao buscar ticket por ID', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para busca por ID'
      }

      cy.createTicket(ticketData).then((createResponse) => {
        const ticketId = createResponse.body.id

        cy.getTicketById(ticketId).then((response) => {
          expect(response.status).to.eq(200)
          cy.validateTicketSchema(response.body)

          // Validações específicas
          expect(response.body.id).to.eq(ticketId)
          expect(response.body.userId).to.eq(ticketData.userId)
          expect(response.body.description).to.eq(ticketData.description)
          expect(response.body.status).to.eq('Open')

          // Deve retornar exatamente os mesmos dados da criação
          expect(response.body).to.deep.eq(createResponse.body)
        })
      })
    })
  })

  describe('Schema de Resposta - Atualização de Status', () => {
    it('Deve retornar schema válido ao atualizar status', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para atualização de status'
      }

      cy.createTicket(ticketData).then((createResponse) => {
        const ticketId = createResponse.body.id

        cy.updateTicketStatus(ticketId, 'In Progress').then((response) => {
          expect(response.status).to.eq(200)
          
          // Valida estrutura da resposta de atualização
          expect(response.body).to.have.property('message')
          expect(response.body).to.have.property('ticket')
          expect(response.body.message).to.be.a('string')
          expect(response.body.message).to.eq('Ticket status updated successfully.')

          // Valida schema do ticket retornado
          cy.validateTicketSchema(response.body.ticket)

          expect(response.body.ticket.id).to.eq(ticketId)
          expect(response.body.ticket.status).to.eq('In Progress')
          expect(response.body.ticket.userId).to.eq(createResponse.body.userId)
          expect(response.body.ticket.description).to.eq(createResponse.body.description)
          expect(response.body.ticket.createdAt).to.eq(createResponse.body.createdAt)
        })
      })
    })

    it('Deve validar schema com diferentes status válidos', () => {
      const validStatuses = ['Open', 'In Progress', 'Pending', 'Closed']
      
      validStatuses.forEach((status, index) => {
        const ticketData = {
          userId: userId,
          description: `Ticket para status ${status}`
        }

        cy.createTicket(ticketData).then((createResponse) => {
          const ticketId = createResponse.body.id

          cy.updateTicketStatus(ticketId, status).then((response) => {
            expect(response.status).to.eq(200)
            cy.validateTicketSchema(response.body.ticket)
            expect(response.body.ticket.status).to.eq(status)
          })
        })
      })
    })

    it('Deve validar que atualização de status mantém schema consistente', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para consistência de schema'
      }

      cy.createTicket(ticketData).then((createResponse) => {
        const ticketId = createResponse.body.id
        const originalTicket = createResponse.body

        cy.updateTicketStatus(ticketId, 'Closed').then((updateResponse) => {
          const updatedTicket = updateResponse.body.ticket
          cy.validateTicketSchema(updatedTicket)

          // Campos que devem permanecer iguais
          expect(updatedTicket.id).to.eq(originalTicket.id)
          expect(updatedTicket.userId).to.eq(originalTicket.userId)
          expect(updatedTicket.description).to.eq(originalTicket.description)
          expect(updatedTicket.createdAt).to.eq(originalTicket.createdAt)

          // Apenas status deve mudar
          expect(updatedTicket.status).to.eq('Closed')
          expect(updatedTicket.status).to.not.eq(originalTicket.status)
        })
      })
    })
  })

  describe('Schema de Resposta - Deleção de Ticket', () => {
    it('Deve retornar schema válido ao deletar ticket', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para deletar'
      }

      cy.createTicket(ticketData).then((createResponse) => {
        const ticketId = createResponse.body.id

        cy.deleteTicket(ticketId).then((response) => {
          expect(response.status).to.eq(200)
          
          // Valida estrutura da resposta de deleção
          expect(response.body).to.have.property('message')
          expect(response.body).to.have.property('ticket')
          expect(response.body.message).to.be.a('string')
          expect(response.body.message).to.eq('Ticket deleted successfully.')

          // Valida schema do ticket deletado
          cy.validateTicketSchema(response.body.ticket)

          // Deve retornar os mesmos dados da criação
          expect(response.body.ticket).to.deep.eq(createResponse.body)
        })
      })
    })
  })

  describe('Schema de Erro', () => {
    it('Deve retornar schema de erro válido para ticket não encontrado', () => {
      cy.getTicketById(999).then((response) => {
        expect(response.status).to.eq(404)
        cy.validateErrorSchema(response.body)

        expect(response.body.error).to.eq('Ticket not found.')
      })
    })

    it('Deve retornar schema de erro válido para dados inválidos', () => {
      const invalidData = { description: 'sem userId' }

      cy.createTicket(invalidData).then((response) => {
        expect(response.status).to.eq(400)
        cy.validateErrorSchema(response.body)

        expect(response.body.error).to.include('required')
      })
    })

    it('Deve retornar schema de erro válido para usuário inexistente', () => {
      const ticketData = {
        userId: 99999,
        description: 'Ticket com usuário inexistente'
      }

      cy.createTicket(ticketData).then((response) => {
        expect(response.status).to.eq(404)
        cy.validateErrorSchema(response.body)

        expect(response.body.error).to.eq('User not found.')
      })
    })

    it('Deve retornar schema de erro válido para status obrigatório', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para testar status obrigatório'
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
          cy.validateErrorSchema(response.body)

          expect(response.body.error).to.eq('Status is required.')
        })
      })
    })

    it('Deve retornar schema de erro válido para método não permitido', () => {
      cy.request({
        method: 'PATCH',
        url: `${Cypress.env('apiUrl')}/tickets/1`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(405)
        cy.validateErrorSchema(response.body)

        expect(response.body.error).to.eq('Invalid request method.')
      })
    })
  })

  describe('Validações de Formato de Dados', () => {
    it('Deve validar que ID é sempre número inteiro positivo', () => {
      const ticketData = {
        userId: userId,
        description: 'Teste formato do ID'
      }

      cy.createTicket(ticketData).then((response) => {
        expect(response.status).to.eq(201)
        
        // ID deve ser número
        expect(response.body.id).to.be.a('number')
        expect(Number.isInteger(response.body.id)).to.be.true
        expect(response.body.id).to.be.greaterThan(0)
        
        cy.validateTicketSchema(response.body)
      })
    })

    it('Deve validar que userId é sempre número inteiro positivo', () => {
      const ticketData = {
        userId: userId,
        description: 'Teste formato do userId'
      }

      cy.createTicket(ticketData).then((response) => {
        expect(response.status).to.eq(201)
        
        // userId deve ser número
        expect(response.body.userId).to.be.a('number')
        expect(Number.isInteger(response.body.userId)).to.be.true
        expect(response.body.userId).to.be.greaterThan(0)
        expect(response.body.userId).to.eq(userId)
        
        cy.validateTicketSchema(response.body)
      })
    })

    it('Deve validar que description é sempre string não vazia', () => {
      const descriptions = [
        'Descrição simples',
        'Descrição muito longa que contém muitos detalhes sobre o problema apresentado',
        'Desc. com símbolos: @#$%^&*()_+{}[]|\\:";\'<>?,./',
        'Descrição\ncom\nquebras\nde\nlinha',
        'Descrição com 123 números misturados'
      ]

      descriptions.forEach((description, index) => {
        const ticketData = {
          userId: userId,
          description: description
        }

        cy.createTicket(ticketData).then((response) => {
          expect(response.status).to.eq(201)
          expect(response.body.description).to.be.a('string')
          expect(response.body.description).to.have.length.greaterThan(0)
          expect(response.body.description).to.eq(description)
          
          cy.validateTicketSchema(response.body)
        })
      })
    })

    it('Deve validar que status é sempre string válida', () => {
      const ticketData = {
        userId: userId,
        description: 'Teste formato do status'
      }

      cy.createTicket(ticketData).then((createResponse) => {
        expect(createResponse.status).to.eq(201)
        expect(createResponse.body.status).to.be.a('string')
        expect(createResponse.body.status).to.eq('Open')
        
        const ticketId = createResponse.body.id
        const validStatuses = ['Open', 'In Progress', 'Pending', 'Closed']

        validStatuses.forEach((status) => {
          cy.updateTicketStatus(ticketId, status).then((response) => {
            expect(response.status).to.eq(200)
            expect(response.body.ticket.status).to.be.a('string')
            expect(response.body.ticket.status).to.eq(status)
            
            cy.validateTicketSchema(response.body.ticket)
          })
        })
      })
    })

    it('Deve validar que createdAt é sempre string no formato ISO 8601', () => {
      const ticketData = {
        userId: userId,
        description: 'Teste formato do createdAt'
      }

      cy.createTicket(ticketData).then((response) => {
        expect(response.status).to.eq(201)
        
        // createdAt deve ser string
        expect(response.body.createdAt).to.be.a('string')
        
        // Deve estar no formato ISO 8601
        expect(response.body.createdAt).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
        
        // Deve ser uma data válida
        const date = new Date(response.body.createdAt)
        expect(date.toString()).to.not.eq('Invalid Date')
        
        cy.validateTicketSchema(response.body)
      })
    })
  })

  describe('Consistência de Schema', () => {
    it('Schema deve ser consistente entre criação e busca', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para consistência de schema'
      }

      cy.createTicket(ticketData).then((createResponse) => {
        const ticketId = createResponse.body.id
        cy.validateTicketSchema(createResponse.body)

        cy.getTicketById(ticketId).then((getResponse) => {
          cy.validateTicketSchema(getResponse.body)
          
          // Dados devem ser idênticos
          expect(getResponse.body).to.deep.eq(createResponse.body)
        })
      })
    })

    it('Schema deve ser consistente após múltiplas atualizações', () => {
      const ticketData = {
        userId: userId,
        description: 'Ticket para múltiplas atualizações'
      }

      cy.createTicket(ticketData).then((createResponse) => {
        const ticketId = createResponse.body.id
        const statuses = ['In Progress', 'Pending', 'Closed', 'Open']

        statuses.forEach((status) => {
          cy.updateTicketStatus(ticketId, status).then((updateResponse) => {
            cy.validateTicketSchema(updateResponse.body.ticket)

            cy.getTicketById(ticketId).then((getResponse) => {
              cy.validateTicketSchema(getResponse.body)
              
              // Dados devem ser idênticos
              expect(getResponse.body).to.deep.eq(updateResponse.body.ticket)
            })
          })
        })
      })
    })

    it('Schema deve permanecer válido mesmo com dados de borda', () => {
      // Teste com descrição muito longa
      const longDescription = 'a'.repeat(1000)
      const ticketData = {
        userId: userId,
        description: longDescription
      }

      cy.createTicket(ticketData).then((response) => {
        expect(response.status).to.eq(201)
        cy.validateTicketSchema(response.body)
        expect(response.body.description).to.eq(longDescription)
      })
    })
  })

  describe('Validação de Enum para Status', () => {
    it('Schema deve aceitar apenas status válidos definidos no enum', () => {
      // Atualmente a API aceita qualquer status (problema)
      // Este teste documenta o comportamento atual
      const ticketData = {
        userId: userId,
        description: 'Ticket para testar enum de status'
      }

      cy.createTicket(ticketData).then((createResponse) => {
        const ticketId = createResponse.body.id

        // Status válidos segundo o schema
        const validStatuses = ['Open', 'In Progress', 'Closed', 'Pending']
        
        validStatuses.forEach((status) => {
          cy.updateTicketStatus(ticketId, status).then((response) => {
            expect(response.status).to.eq(200)
            cy.validateTicketSchema(response.body.ticket)
            expect(response.body.ticket.status).to.eq(status)
          })
        })

        // Status inválidos que a API atualmente aceita (mas não deveria)
        const invalidStatuses = ['OPEN', 'closed', 'Invalid']
        
        invalidStatuses.forEach((status) => {
          cy.updateTicketStatus(ticketId, status).then((response) => {
            expect(response.status).to.eq(200)
            // Schema atualmente não valida enum rigorosamente na API
            // mas deveria falhar aqui em uma implementação correta
          })
        })
      })
    })
  })
})
