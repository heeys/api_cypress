// cypress/e2e/api/integration/full-workflow.cy.js

describe('API Integration - Fluxo Completo do Sistema', () => {
  
  beforeEach(() => {
    // Limpa dados antes de cada teste
    cy.cleanupData()
  })

  after(() => {
    // Limpa dados após todos os testes
    cy.cleanupData()
  })

  describe('Cenário: Fluxo Completo de Helpdesk', () => {
    it('Deve executar fluxo completo de criação de usuário e gerenciamento de tickets', () => {
      // 1. Criar usuário
      const userData = {
        name: 'João Silva',
        email: 'joao.silva@empresa.com'
      }

      cy.createUser(userData).then((userResponse) => {
        expect(userResponse.status).to.eq(201)
        const userId = userResponse.body.id
        cy.validateUserSchema(userResponse.body)

        // 2. Verificar se usuário foi criado na lista
        cy.getUsers().then((usersResponse) => {
          expect(usersResponse.status).to.eq(200)
          expect(usersResponse.body).to.have.length(1)
          expect(usersResponse.body[0].id).to.eq(userId)
        })

        // 3. Criar primeiro ticket
        const ticket1Data = {
          userId: userId,
          description: 'Sistema apresentando lentidão na tela de login'
        }

        cy.createTicket(ticket1Data).then((ticket1Response) => {
          expect(ticket1Response.status).to.eq(201)
          const ticket1Id = ticket1Response.body.id
          cy.validateTicketSchema(ticket1Response.body)
          expect(ticket1Response.body.status).to.eq('Open')

          // 4. Criar segundo ticket
          const ticket2Data = {
            userId: userId,
            description: 'Erro ao enviar relatórios por email'
          }

          cy.createTicket(ticket2Data).then((ticket2Response) => {
            expect(ticket2Response.status).to.eq(201)
            const ticket2Id = ticket2Response.body.id
            expect(ticket2Response.body.status).to.eq('Open')

            // 5. Atualizar status do primeiro ticket para "In Progress"
            cy.updateTicketStatus(ticket1Id, 'In Progress').then((updateResponse) => {
              expect(updateResponse.status).to.eq(200)
              expect(updateResponse.body.ticket.status).to.eq('In Progress')

              // 6. Verificar se ticket foi atualizado
              cy.getTicketById(ticket1Id).then((getTicket1Response) => {
                expect(getTicket1Response.status).to.eq(200)
                expect(getTicket1Response.body.status).to.eq('In Progress')
              })

              // 7. Fechar primeiro ticket
              cy.updateTicketStatus(ticket1Id, 'Closed').then((closeResponse) => {
                expect(closeResponse.status).to.eq(200)
                expect(closeResponse.body.ticket.status).to.eq('Closed')

                // 8. Colocar segundo ticket em pendente
                cy.updateTicketStatus(ticket2Id, 'Pending').then((pendingResponse) => {
                  expect(pendingResponse.status).to.eq(200)
                  expect(pendingResponse.body.ticket.status).to.eq('Pending')

                  // 9. Depois colocar segundo ticket em progresso
                  cy.updateTicketStatus(ticket2Id, 'In Progress').then((progressResponse) => {
                    expect(progressResponse.status).to.eq(200)
                    expect(progressResponse.body.ticket.status).to.eq('In Progress')

                    // 10. Fechar segundo ticket
                    cy.updateTicketStatus(ticket2Id, 'Closed').then((finalCloseResponse) => {
                      expect(finalCloseResponse.status).to.eq(200)
                      expect(finalCloseResponse.body.ticket.status).to.eq('Closed')

                      // 11. Verificar estado final dos tickets
                      cy.getTicketById(ticket1Id).then((finalTicket1) => {
                        expect(finalTicket1.body.status).to.eq('Closed')
                      })

                      cy.getTicketById(ticket2Id).then((finalTicket2) => {
                        expect(finalTicket2.body.status).to.eq('Closed')

                        // 12. Deletar tickets
                        cy.deleteTicket(ticket1Id).then((deleteTicket1Response) => {
                          expect(deleteTicket1Response.status).to.eq(200)

                          cy.deleteTicket(ticket2Id).then((deleteTicket2Response) => {
                            expect(deleteTicket2Response.status).to.eq(200)

                            // 13. Verificar se tickets foram deletados
                            cy.getTicketById(ticket1Id).then((checkTicket1) => {
                              expect(checkTicket1.status).to.eq(404)
                            })

                            cy.getTicketById(ticket2Id).then((checkTicket2) => {
                              expect(checkTicket2.status).to.eq(404)

                              // 14. Deletar usuário
                              cy.deleteUser(userId).then((deleteUserResponse) => {
                                expect(deleteUserResponse.status).to.eq(200)

                                // 15. Verificar se usuário foi deletado
                                cy.getUserById(userId).then((checkUser) => {
                                  expect(checkUser.status).to.eq(404)

                                  // 16. Verificar se lista de usuários está vazia
                                  cy.getUsers().then((finalUsersResponse) => {
                                    expect(finalUsersResponse.status).to.eq(200)
                                    expect(finalUsersResponse.body).to.have.length(0)
                                  })
                                })
                              })
                            })
                          })
                        })
                      })
                    })
                  })
                })
              })
            })
          })
        })
      })
    })
  })

  describe('Cenário: Múltiplos Usuários e Tickets', () => {
    it('Deve gerenciar múltiplos usuários com seus respectivos tickets', () => {
      // Criar 3 usuários
      const users = [
        { name: 'Ana Costa', email: 'ana.costa@empresa.com' },
        { name: 'Carlos Santos', email: 'carlos.santos@empresa.com' },
        { name: 'Maria Oliveira', email: 'maria.oliveira@empresa.com' }
      ]

      const userIds = []

      // Criar usuários sequencialmente
      users.forEach((userData, userIndex) => {
        cy.createUser(userData).then((userResponse) => {
          expect(userResponse.status).to.eq(201)
          userIds[userIndex] = userResponse.body.id

          // Criar 2 tickets para cada usuário
          const ticketsPerUser = [
            { description: `Ticket 1 do ${userData.name}` },
            { description: `Ticket 2 do ${userData.name}` }
          ]

          ticketsPerUser.forEach((ticketData) => {
            const fullTicketData = {
              userId: userResponse.body.id,
              description: ticketData.description
            }

            cy.createTicket(fullTicketData).then((ticketResponse) => {
              expect(ticketResponse.status).to.eq(201)
              expect(ticketResponse.body.userId).to.eq(userResponse.body.id)
            })
          })
        })
      })

      // Verificar se todos os usuários foram criados
      cy.then(() => {
        cy.getUsers().then((usersResponse) => {
          expect(usersResponse.status).to.eq(200)
          expect(usersResponse.body).to.have.length(3)

          // Verificar se cada usuário tem dados corretos
          users.forEach((originalUser, index) => {
            const foundUser = usersResponse.body.find(user => user.email === originalUser.email)
            expect(foundUser).to.exist
            expect(foundUser.name).to.eq(originalUser.name)
          })
        })
      })
    })
  })

  describe('Cenário: Integridade Referencial', () => {
    it('Deve manter integridade quando usuário é deletado após criação de tickets', () => {
      // 1. Criar usuário
      const userData = { name: 'Usuário Temporário', email: 'temp@empresa.com' }

      cy.createUser(userData).then((userResponse) => {
        const userId = userResponse.body.id

        // 2. Criar ticket para este usuário
        const ticketData = {
          userId: userId,
          description: 'Ticket que ficará órfão'
        }

        cy.createTicket(ticketData).then((ticketResponse) => {
          const ticketId = ticketResponse.body.id

          // 3. Deletar o usuário
          cy.deleteUser(userId).then((deleteUserResponse) => {
            expect(deleteUserResponse.status).to.eq(200)

            // 4. Verificar se usuário foi deletado
            cy.getUserById(userId).then((checkUserResponse) => {
              expect(checkUserResponse.status).to.eq(404)

              // 5. Verificar se ticket ainda existe (orphan ticket)
              cy.getTicketById(ticketId).then((checkTicketResponse) => {
                expect(checkTicketResponse.status).to.eq(200)
                expect(checkTicketResponse.body.userId).to.eq(userId) // Referência mantida

                // 6. Deve permitir atualizar ticket órfão
                cy.updateTicketStatus(ticketId, 'Closed').then((updateResponse) => {
                  expect(updateResponse.status).to.eq(200)

                  // 7. Deve permitir deletar ticket órfão
                  cy.deleteTicket(ticketId).then((deleteTicketResponse) => {
                    expect(deleteTicketResponse.status).to.eq(200)
                  })
                })
              })
            })
          })
        })
      })
    })
  })

  describe('Cenário: Validação de Regras de Negócio Completas', () => {
    it('Deve validar todas as regras de negócio em conjunto', () => {
      // 1. Tentar criar ticket sem usuário (deve falhar)
      const invalidTicket = {
        userId: 99999,
        description: 'Ticket para usuário inexistente'
      }

      cy.createTicket(invalidTicket).then((response) => {
        expect(response.status).to.eq(404)
        expect(response.body.error).to.eq('User not found.')
      })

      // 2. Criar usuário válido
      const userData = { name: 'Usuário Válido', email: 'valido@empresa.com' }

      cy.createUser(userData).then((userResponse) => {
        const userId = userResponse.body.id

        // 3. Tentar criar usuário duplicado (deve falhar)
        cy.createUser(userData).then((duplicateResponse) => {
          expect(duplicateResponse.status).to.eq(409)
          expect(duplicateResponse.body.error).to.include('already exists')

          // 4. Criar ticket válido
          const validTicket = {
            userId: userId,
            description: 'Ticket válido para teste completo'
          }

          cy.createTicket(validTicket).then((ticketResponse) => {
            expect(ticketResponse.status).to.eq(201)
            const ticketId = ticketResponse.body.id

            // 5. Testar todas as transições de status válidas
            const statusFlow = ['In Progress', 'Pending', 'Closed', 'Open']

            statusFlow.forEach((status, index) => {
              cy.updateTicketStatus(ticketId, status).then((updateResponse) => {
                expect(updateResponse.status).to.eq(200)
                expect(updateResponse.body.ticket.status).to.eq(status)

                // Verificar que outros campos não mudaram
                expect(updateResponse.body.ticket.id).to.eq(ticketId)
                expect(updateResponse.body.ticket.userId).to.eq(userId)
                expect(updateResponse.body.ticket.description).to.eq(validTicket.description)
                expect(updateResponse.body.ticket.createdAt).to.eq(ticketResponse.body.createdAt)
              })
            })

            // 6. Tentar atualizar status de ticket inexistente (deve falhar)
            cy.updateTicketStatus(99999, 'Closed').then((invalidUpdateResponse) => {
              expect(invalidUpdateResponse.status).to.eq(404)
              expect(invalidUpdateResponse.body.error).to.eq('Ticket not found.')

              // 7. Tentar deletar ticket inexistente (deve falhar)
              cy.deleteTicket(99999).then((invalidDeleteResponse) => {
                expect(invalidDeleteResponse.status).to.eq(404)
                expect(invalidDeleteResponse.body.error).to.eq('Ticket not found.')

                // 8. Deletar ticket válido
                cy.deleteTicket(ticketId).then((deleteResponse) => {
                  expect(deleteResponse.status).to.eq(200)

                  // 9. Tentar acessar ticket deletado (deve falhar)
                  cy.getTicketById(ticketId).then((deletedTicketResponse) => {
                    expect(deletedTicketResponse.status).to.eq(404)

                    // 10. Deletar usuário
                    cy.deleteUser(userId).then((deleteUserResponse) => {
                      expect(deleteUserResponse.status).to.eq(200)

                      // 11. Tentar acessar usuário deletado (deve falhar)
                      cy.getUserById(userId).then((deletedUserResponse) => {
                        expect(deletedUserResponse.status).to.eq(404)
                      })
                    })
                  })
                })
              })
            })
          })
        })
      })
    })
  })

  describe('Cenário: Performance em Fluxo Complexo', () => {
    it('Deve manter performance aceitável em operações complexas', () => {
      const startTime = Date.now()

      // Criar 5 usuários
      const users = Array.from({ length: 5 }, (_, i) => ({
        name: `Performance User ${i + 1}`,
        email: `perf${i + 1}@empresa.com`
      }))

      users.forEach((userData) => {
        cy.createUser(userData).then((userResponse) => {
          const userId = userResponse.body.id

          // Criar 3 tickets para cada usuário
          Array.from({ length: 3 }, (_, ticketIndex) => {
            const ticketData = {
              userId: userId,
              description: `Performance ticket ${ticketIndex + 1} for user ${userId}`
            }

            cy.createTicket(ticketData).then((ticketResponse) => {
              const ticketId = ticketResponse.body.id

              // Atualizar status algumas vezes
              cy.updateTicketStatus(ticketId, 'In Progress')
              cy.updateTicketStatus(ticketId, 'Closed')
            })
          })
        })
      })

      // Verificar que todo o fluxo terminou em tempo razoável
      cy.then(() => {
        const endTime = Date.now()
        const totalTime = endTime - startTime
        
        // Fluxo completo deve terminar em menos de 30 segundos
        expect(totalTime).to.be.lessThan(30000)
        
        cy.task('log', `Fluxo de performance completado em ${totalTime}ms`)
      })
    })
  })

  describe('Cenário: Recuperação de Erros', () => {
    it('Deve se recuperar graciosamente de erros durante o fluxo', () => {
      // 1. Criar usuário
      const userData = { name: 'User Recovery', email: 'recovery@empresa.com' }

      cy.createUser(userData).then((userResponse) => {
        const userId = userResponse.body.id

        // 2. Tentar operações inválidas e continuar o fluxo
        
        // Tentar criar ticket inválido
        cy.createTicket({ userId: userId }).then((invalidResponse) => {
          expect(invalidResponse.status).to.eq(400)

          // Criar ticket válido após erro
          const validTicket = {
            userId: userId,
            description: 'Ticket válido após erro'
          }

          cy.createTicket(validTicket).then((ticketResponse) => {
            expect(ticketResponse.status).to.eq(201)
            const ticketId = ticketResponse.body.id

            // Tentar atualizar com status inválido
            cy.request({
              method: 'PUT',
              url: `${Cypress.env('apiUrl')}/tickets/${ticketId}/status`,
              body: {},
              failOnStatusCode: false
            }).then((invalidUpdateResponse) => {
              expect(invalidUpdateResponse.status).to.eq(400)

              // Atualizar com status válido após erro
              cy.updateTicketStatus(ticketId, 'Closed').then((validUpdateResponse) => {
                expect(validUpdateResponse.status).to.eq(200)

                // Sistema deve continuar funcionando normalmente
                cy.getTicketById(ticketId).then((getResponse) => {
                  expect(getResponse.status).to.eq(200)
                  expect(getResponse.body.status).to.eq('Closed')
                })
              })
            })
          })
        })
      })
    })
  })
})
