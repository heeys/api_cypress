// cypress/e2e/api/users/users-positive.cy.js

describe('API Users - Cenários Positivos', () => {
  
  beforeEach(() => {
    // Limpa dados antes de cada teste
    cy.cleanupData()
  })

  after(() => {
    // Limpa dados após todos os testes
    cy.cleanupData()
  })

  describe('POST /users - Criar Usuário', () => {
    it('Deve criar um usuário com dados válidos', () => {
      const userData = {
        name: 'João Silva',
        email: 'joao.silva@example.com'
      }

      cy.createUser(userData).then((response) => {
        // Validações de status e estrutura
        expect(response.status).to.eq(201)
        expect(response.body).to.have.property('id')
        expect(response.body.id).to.be.a('number')
        expect(response.body.name).to.eq(userData.name)
        expect(response.body.email).to.eq(userData.email)

        // Validação de schema
        cy.validateUserSchema(response.body)
      })
    })

    it('Deve criar múltiplos usuários com dados diferentes', () => {
      cy.fixture('users').then((usersData) => {
        usersData.validUsers.forEach((userData, index) => {
          cy.createUser(userData).then((response) => {
            expect(response.status).to.eq(201)
            expect(response.body.id).to.eq(index + 1)
            expect(response.body.name).to.eq(userData.name)
            expect(response.body.email).to.eq(userData.email)
          })
        })
      })
    })

    it('Deve gerar ID sequencial para novos usuários', () => {
      const user1 = { name: 'User 1', email: 'user1@test.com' }
      const user2 = { name: 'User 2', email: 'user2@test.com' }

      cy.createUser(user1).then((response1) => {
        expect(response1.body.id).to.eq(1)
        
        cy.createUser(user2).then((response2) => {
          expect(response2.body.id).to.eq(2)
        })
      })
    })
  })

  describe('GET /users - Listar Usuários', () => {
    it('Deve retornar lista vazia quando não há usuários', () => {
      cy.getUsers().then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.be.an('array')
        expect(response.body).to.have.length(0)
      })
    })

    it('Deve listar todos os usuários cadastrados', () => {
      // Cria usuários de teste
      const users = [
        { name: 'User 1', email: 'user1@test.com' },
        { name: 'User 2', email: 'user2@test.com' },
        { name: 'User 3', email: 'user3@test.com' }
      ]

      // Cria todos os usuários
      users.forEach(user => {
        cy.createUser(user)
      })

      // Verifica a listagem
      cy.getUsers().then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.be.an('array')
        expect(response.body).to.have.length(3)

        // Valida schema de cada usuário
        cy.validateUsersListSchema(response.body)

        // Verifica se todos os usuários estão na lista
        users.forEach((user, index) => {
          expect(response.body[index].name).to.eq(user.name)
          expect(response.body[index].email).to.eq(user.email)
        })
      })
    })
  })

  describe('GET /users/:id - Buscar Usuário por ID', () => {
    it('Deve retornar usuário específico por ID', () => {
      const userData = { name: 'João Silva', email: 'joao@test.com' }
      
      cy.createUserAndGetId(userData).then((userId) => {
        cy.getUserById(userId).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body.id).to.eq(userId)
          expect(response.body.name).to.eq(userData.name)
          expect(response.body.email).to.eq(userData.email)

          // Validação de schema
          cy.validateUserSchema(response.body)
        })
      })
    })

    it('Deve buscar usuários com IDs diferentes', () => {
      const users = [
        { name: 'User 1', email: 'user1@test.com' },
        { name: 'User 2', email: 'user2@test.com' }
      ]

      users.forEach((user, index) => {
        cy.createUser(user).then((response) => {
          const userId = response.body.id

          cy.getUserById(userId).then((getResponse) => {
            expect(getResponse.status).to.eq(200)
            expect(getResponse.body.id).to.eq(userId)
            expect(getResponse.body.name).to.eq(user.name)
            expect(getResponse.body.email).to.eq(user.email)
          })
        })
      })
    })
  })

  describe('PUT /users/:id - Atualizar Usuário', () => {
    it('Deve atualizar todos os campos do usuário', () => {
      const originalUser = { name: 'Nome Original', email: 'original@test.com' }
      const updateData = { name: 'Nome Atualizado', email: 'atualizado@test.com' }

      cy.createUserAndGetId(originalUser).then((userId) => {
        cy.updateUser(userId, updateData).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body.message).to.eq('User updated successfully.')
          expect(response.body.user.id).to.eq(userId)
          expect(response.body.user.name).to.eq(updateData.name)
          expect(response.body.user.email).to.eq(updateData.email)

          // Validação de schema
          cy.validateUserSchema(response.body.user)
        })
      })
    })

    it('Deve atualizar apenas o nome do usuário', () => {
      const originalUser = { name: 'Nome Original', email: 'original@test.com' }
      const updateData = { name: 'Nome Atualizado' }

      cy.createUserAndGetId(originalUser).then((userId) => {
        cy.updateUser(userId, updateData).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body.user.name).to.eq(updateData.name)
          expect(response.body.user.email).to.eq(originalUser.email) // Email deve permanecer o mesmo
        })
      })
    })

    it('Deve atualizar apenas o email do usuário', () => {
      const originalUser = { name: 'Nome Original', email: 'original@test.com' }
      const updateData = { email: 'novo@test.com' }

      cy.createUserAndGetId(originalUser).then((userId) => {
        cy.updateUser(userId, updateData).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body.user.name).to.eq(originalUser.name) // Nome deve permanecer o mesmo
          expect(response.body.user.email).to.eq(updateData.email)
        })
      })
    })
  })

  describe('DELETE /users/:id - Deletar Usuário', () => {
    it('Deve deletar usuário existente', () => {
      const userData = { name: 'Usuário para Deletar', email: 'deletar@test.com' }

      cy.createUserAndGetId(userData).then((userId) => {
        cy.deleteUser(userId).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body.message).to.eq('User deleted successfully.')
          expect(response.body.user.id).to.eq(userId)
          expect(response.body.user.name).to.eq(userData.name)
          expect(response.body.user.email).to.eq(userData.email)
        })

        // Verifica se o usuário foi realmente deletado
        cy.getUserById(userId).then((getResponse) => {
          expect(getResponse.status).to.eq(404)
          cy.validateErrorSchema(getResponse.body)
        })
      })
    })

    it('Deve deletar múltiplos usuários', () => {
      const users = [
        { name: 'User 1', email: 'user1@test.com' },
        { name: 'User 2', email: 'user2@test.com' },
        { name: 'User 3', email: 'user3@test.com' }
      ]

      const userIds = []

      // Cria usuários
      users.forEach(user => {
        cy.createUser(user).then((response) => {
          userIds.push(response.body.id)
        })
      })

      // Deleta usuários
      cy.then(() => {
        userIds.forEach(userId => {
          cy.deleteUser(userId).then((response) => {
            expect(response.status).to.eq(200)
            expect(response.body.message).to.eq('User deleted successfully.')
          })
        })
      })

      // Verifica se a lista está vazia
      cy.getUsers().then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.length(0)
      })
    })
  })

  describe('Validações de Performance', () => {
    it('Todas as operações devem ter tempo de resposta aceitável', () => {
      const userData = { name: 'Performance Test', email: 'perf@test.com' }

      // CREATE - Deve ser rápido
      cy.createUser(userData).then((response) => {
        expect(response.duration).to.be.lessThan(1000) // menos de 1 segundo
        
        const userId = response.body.id

        // READ - Deve ser muito rápido
        cy.getUserById(userId).then((getResponse) => {
          expect(getResponse.duration).to.be.lessThan(500) // menos de 0.5 segundo
        })

        // UPDATE - Deve ser rápido
        cy.updateUser(userId, { name: 'Updated Name' }).then((updateResponse) => {
          expect(updateResponse.duration).to.be.lessThan(1000)
        })

        // DELETE - Deve ser rápido
        cy.deleteUser(userId).then((deleteResponse) => {
          expect(deleteResponse.duration).to.be.lessThan(1000)
        })
      })

      // LIST - Deve ser rápido mesmo com dados
      cy.getUsers().then((response) => {
        expect(response.duration).to.be.lessThan(1000)
      })
    })
  })
})
