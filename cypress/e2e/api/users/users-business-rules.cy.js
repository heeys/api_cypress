// cypress/e2e/api/users/users-business-rules.cy.js

describe('API Users - Regras de Negócio', () => {
  
  beforeEach(() => {
    // Limpa dados antes de cada teste
    cy.cleanupData()
  })

  after(() => {
    // Limpa dados após todos os testes
    cy.cleanupData()
  })

  describe('Regra: Unicidade de Nome e Email', () => {
    it('Não deve permitir usuários com mesmo nome', () => {
      const user1 = { name: 'João Silva', email: 'joao1@example.com' }
      const user2 = { name: 'João Silva', email: 'joao2@example.com' }

      cy.createUser(user1).then((response1) => {
        expect(response1.status).to.eq(201)

        cy.createUser(user2).then((response2) => {
          expect(response2.status).to.eq(409)
          expect(response2.body.error).to.include('name or email already exists')
        })
      })
    })

    it('Não deve permitir usuários com mesmo email', () => {
      const user1 = { name: 'João Silva', email: 'joao@example.com' }
      const user2 = { name: 'João Santos', email: 'joao@example.com' }

      cy.createUser(user1).then((response1) => {
        expect(response1.status).to.eq(201)

        cy.createUser(user2).then((response2) => {
          expect(response2.status).to.eq(409)
          expect(response2.body.error).to.include('name or email already exists')
        })
      })
    })

    it('Deve permitir usuários com nomes similares mas não idênticos', () => {
      const users = [
        { name: 'João Silva', email: 'joao1@example.com' },
        { name: 'João Santos', email: 'joao2@example.com' },
        { name: 'João da Silva', email: 'joao3@example.com' },
        { name: 'JOÃO SILVA', email: 'joao4@example.com' }, // Case sensitive
        { name: 'joao silva', email: 'joao5@example.com' }  // Case sensitive
      ]

      users.forEach(userData => {
        cy.createUser(userData).then((response) => {
          expect(response.status).to.eq(201)
          expect(response.body.name).to.eq(userData.name)
          expect(response.body.email).to.eq(userData.email)
        })
      })
    })

    it('Deve permitir reutilizar nome/email após deleção', () => {
      const userData = { name: 'João Silva', email: 'joao@example.com' }

      // Cria usuário
      cy.createUserAndGetId(userData).then((userId) => {
        // Deleta usuário
        cy.deleteUser(userId).then((deleteResponse) => {
          expect(deleteResponse.status).to.eq(200)

          // Deve permitir criar novamente com mesmo nome/email
          cy.createUser(userData).then((createResponse) => {
            expect(createResponse.status).to.eq(201)
            expect(createResponse.body.name).to.eq(userData.name)
            expect(createResponse.body.email).to.eq(userData.email)
          })
        })
      })
    })
  })

  describe('Regra: Geração Automática de ID', () => {
    it('Deve gerar IDs sequenciais', () => {
      const users = [
        { name: 'User 1', email: 'user1@test.com' },
        { name: 'User 2', email: 'user2@test.com' },
        { name: 'User 3', email: 'user3@test.com' }
      ]

      users.forEach((user, index) => {
        cy.createUser(user).then((response) => {
          expect(response.status).to.eq(201)
          expect(response.body.id).to.eq(index + 1)
        })
      })
    })

    it('Deve manter sequência mesmo com deleções', () => {
      const user1 = { name: 'User 1', email: 'user1@test.com' }
      const user2 = { name: 'User 2', email: 'user2@test.com' }
      const user3 = { name: 'User 3', email: 'user3@test.com' }

      // Cria três usuários
      cy.createUser(user1).then((response1) => {
        expect(response1.body.id).to.eq(1)

        cy.createUser(user2).then((response2) => {
          expect(response2.body.id).to.eq(2)

          // Deleta o segundo usuário
          cy.deleteUser(2).then(() => {
            // Cria terceiro usuário - deve ter ID 3
            cy.createUser(user3).then((response3) => {
              expect(response3.body.id).to.eq(3)
            })
          })
        })
      })
    })

    it('ID deve ser número inteiro positivo', () => {
      const userData = { name: 'Teste ID', email: 'id@test.com' }

      cy.createUser(userData).then((response) => {
        expect(response.status).to.eq(201)
        expect(response.body.id).to.be.a('number')
        expect(response.body.id).to.be.greaterThan(0)
        expect(Number.isInteger(response.body.id)).to.be.true
      })
    })
  })

  describe('Regra: Imutabilidade do ID', () => {
    it('Não deve permitir alterar ID via PUT', () => {
      const userData = { name: 'Teste ID', email: 'id@test.com' }

      cy.createUserAndGetId(userData).then((originalId) => {
        const updateData = { id: 999, name: 'Nome Atualizado' }

        cy.updateUser(originalId, updateData).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body.user.id).to.eq(originalId) // ID original mantido
          expect(response.body.user.name).to.eq(updateData.name)
        })
      })
    })

    it('ID deve permanecer o mesmo após múltiplas atualizações', () => {
      const userData = { name: 'Teste Múltiplas', email: 'multiplas@test.com' }

      cy.createUserAndGetId(userData).then((userId) => {
        const updates = [
          { name: 'Nome 1' },
          { email: 'email1@test.com' },
          { name: 'Nome 2', email: 'email2@test.com' },
          { name: 'Nome Final' }
        ]

        updates.forEach((updateData, index) => {
          cy.updateUser(userId, updateData).then((response) => {
            expect(response.status).to.eq(200)
            expect(response.body.user.id).to.eq(userId)
          })
        })
      })
    })
  })

  describe('Regra: Campos Obrigatórios', () => {
    it('Nome e email são obrigatórios para criação', () => {
      const invalidCases = [
        { data: {}, description: 'dados vazios' },
        { data: { name: 'Teste' }, description: 'apenas nome' },
        { data: { email: 'teste@example.com' }, description: 'apenas email' },
        { data: { name: '', email: 'teste@example.com' }, description: 'nome vazio' },
        { data: { name: 'Teste', email: '' }, description: 'email vazio' },
        { data: { name: null, email: 'teste@example.com' }, description: 'nome null' },
        { data: { name: 'Teste', email: null }, description: 'email null' }
      ]

      invalidCases.forEach(testCase => {
        cy.createUser(testCase.data).then((response) => {
          expect(response.status).to.eq(400)
          expect(response.body.error).to.include('required')
          cy.task('log', `Teste ${testCase.description}: PASSOU`)
        })
      })
    })

    it('Campos opcionais não devem quebrar a API', () => {
      const userData = {
        name: 'Teste Campos',
        email: 'campos@test.com',
        extraField: 'campo extra',
        id: 999 // Deve ser ignorado
      }

      cy.createUser(userData).then((response) => {
        expect(response.status).to.eq(201)
        expect(response.body).to.have.property('id')
        expect(response.body).to.have.property('name')
        expect(response.body).to.have.property('email')
        expect(response.body).to.not.have.property('extraField')
        expect(response.body.id).to.not.eq(999) // ID gerado automaticamente
      })
    })
  })

  describe('Regra: Integridade de Dados', () => {
    it('Dados devem permanecer consistentes após operações', () => {
      const originalUser = { name: 'João Original', email: 'original@test.com' }

      cy.createUserAndGetId(originalUser).then((userId) => {
        // Busca inicial
        cy.getUserById(userId).then((getResponse1) => {
          expect(getResponse1.status).to.eq(200)
          const userData1 = getResponse1.body

          // Atualização
          const updateData = { name: 'João Atualizado' }
          cy.updateUser(userId, updateData).then((updateResponse) => {
            expect(updateResponse.status).to.eq(200)

            // Busca após atualização
            cy.getUserById(userId).then((getResponse2) => {
              expect(getResponse2.status).to.eq(200)
              const userData2 = getResponse2.body

              // Validações de integridade
              expect(userData2.id).to.eq(userData1.id) // ID mantido
              expect(userData2.name).to.eq(updateData.name) // Nome atualizado
              expect(userData2.email).to.eq(userData1.email) // Email mantido
            })
          })
        })
      })
    })

    it('Lista de usuários deve refletir mudanças em tempo real', () => {
      // Verifica lista vazia
      cy.getUsers().then((response) => {
        expect(response.body).to.have.length(0)
      })

      // Adiciona usuário
      const user1 = { name: 'User 1', email: 'user1@test.com' }
      cy.createUser(user1).then(() => {
        cy.getUsers().then((response) => {
          expect(response.body).to.have.length(1)
          expect(response.body[0].name).to.eq(user1.name)
        })
      })

      // Adiciona segundo usuário
      const user2 = { name: 'User 2', email: 'user2@test.com' }
      cy.createUser(user2).then(() => {
        cy.getUsers().then((response) => {
          expect(response.body).to.have.length(2)
        })
      })

      // Deleta primeiro usuário
      cy.deleteUser(1).then(() => {
        cy.getUsers().then((response) => {
          expect(response.body).to.have.length(1)
          expect(response.body[0].name).to.eq(user2.name)
        })
      })
    })
  })

  describe('Regra: Validação de Formatos', () => {
    it('Deve aceitar nomes com diferentes caracteres válidos', () => {
      const validNames = [
        'João Silva',
        'María García',
        'José da Silva',
        'Ana-Carolina',
        'Dr. Pedro Santos',
        'João & Maria Ltda.',
        'User123',
        'João José da Silva Oliveira Neto'
      ]

      validNames.forEach((name, index) => {
        const userData = { name: name, email: `user${index}@test.com` }

        cy.createUser(userData).then((response) => {
          expect(response.status).to.eq(201)
          expect(response.body.name).to.eq(name)
        })
      })
    })

    it('Deve aceitar emails com formatos válidos diversos', () => {
      const validEmails = [
        'user@domain.com',
        'user.name@domain.com',
        'user+tag@domain.com',
        'user123@domain123.com',
        'user@sub.domain.com',
        'first.last@company.co.uk'
      ]

      validEmails.forEach((email, index) => {
        const userData = { name: `User ${index}`, email: email }

        cy.createUser(userData).then((response) => {
          expect(response.status).to.eq(201)
          expect(response.body.email).to.eq(email)
        })
      })
    })
  })

  describe('Regra: Controle de Concorrência', () => {
    it('Deve processar múltiplas criações simultâneas corretamente', () => {
      const users = Array.from({ length: 5 }, (_, i) => ({
        name: `User Concurrent ${i + 1}`,
        email: `concurrent${i + 1}@test.com`
      }))

      // Cria todos os usuários em paralelo
      const promises = users.map(user => cy.createUser(user))

      // Aguarda todos completarem
      Promise.all(promises).then(() => {
        cy.getUsers().then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body).to.have.length(5)

          // Verifica se todos os IDs são únicos
          const ids = response.body.map(user => user.id)
          const uniqueIds = [...new Set(ids)]
          expect(uniqueIds).to.have.length(5)
        })
      })
    })
  })
})
