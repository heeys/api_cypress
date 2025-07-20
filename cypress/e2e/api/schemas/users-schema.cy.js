// cypress/e2e/api/schemas/users-schema.cy.js

import '../../../support/utils/schema-validator.js'

describe('API Users - Validação de Schemas', () => {
  
  beforeEach(() => {
    // Limpa dados antes de cada teste
    cy.cleanupData()
  })

  after(() => {
    // Limpa dados após todos os testes
    cy.cleanupData()
  })

  describe('Schema de Resposta - Criação de Usuário', () => {
    it('Deve retornar schema válido ao criar usuário', () => {
      const userData = {
        name: 'João Silva',
        email: 'joao.silva@example.com'
      }

      cy.createUser(userData).then((response) => {
        expect(response.status).to.eq(201)
        
        // Validação de schema completo
        cy.validateUserSchema(response.body)

        // Validações específicas de tipos
        expect(response.body.id).to.be.a('number')
        expect(response.body.name).to.be.a('string')
        expect(response.body.email).to.be.a('string')

        // Validações de valores
        expect(response.body.id).to.be.greaterThan(0)
        expect(response.body.name).to.have.length.greaterThan(0)
        expect(response.body.email).to.include('@')
      })
    })

    it('Deve validar schema com diferentes tipos de dados', () => {
      const testCases = [
        {
          name: 'Nome Simples',
          email: 'simples@test.com'
        },
        {
          name: 'Nome Com Acentos àáâãéêíóôõúç',
          email: 'acentos@test.com'
        },
        {
          name: 'Nome Com 123 Números',
          email: 'numeros123@test.com'
        },
        {
          name: 'Nome-Com-Hifens',
          email: 'hifens@test.com'
        }
      ]

      testCases.forEach((userData, index) => {
        cy.createUser(userData).then((response) => {
          expect(response.status).to.eq(201)
          cy.validateUserSchema(response.body)
          
          // Verifica se o ID é sequencial
          expect(response.body.id).to.eq(index + 1)
        })
      })
    })

    it('Deve validar que não há campos extras na resposta', () => {
      const userData = {
        name: 'Teste Extra Fields',
        email: 'extra@test.com',
        extraField: 'não deveria aparecer'
      }

      cy.createUser(userData).then((response) => {
        expect(response.status).to.eq(201)
        
        // Schema deve passar (não permite campos extras)
        cy.validateUserSchema(response.body)

        // Verifica explicitamente que não há campos extras
        const allowedFields = ['id', 'name', 'email']
        const responseFields = Object.keys(response.body)
        
        responseFields.forEach(field => {
          expect(allowedFields).to.include(field)
        })

        expect(response.body).to.not.have.property('extraField')
      })
    })
  })

  describe('Schema de Resposta - Busca de Usuário', () => {
    it('Deve retornar schema válido ao buscar usuário por ID', () => {
      const userData = {
        name: 'Usuário para Busca',
        email: 'busca@test.com'
      }

      cy.createUserAndGetId(userData).then((userId) => {
        cy.getUserById(userId).then((response) => {
          expect(response.status).to.eq(200)
          cy.validateUserSchema(response.body)

          // Validações específicas
          expect(response.body.id).to.eq(userId)
          expect(response.body.name).to.eq(userData.name)
          expect(response.body.email).to.eq(userData.email)
        })
      })
    })
  })

  describe('Schema de Resposta - Lista de Usuários', () => {
    it('Deve retornar schema válido para lista vazia', () => {
      cy.getUsers().then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.be.an('array')
        expect(response.body).to.have.length(0)
        
        cy.validateUsersListSchema(response.body)
      })
    })

    it('Deve retornar schema válido para lista com usuários', () => {
      const users = [
        { name: 'User 1', email: 'user1@test.com' },
        { name: 'User 2', email: 'user2@test.com' },
        { name: 'User 3', email: 'user3@test.com' }
      ]

      // Cria usuários
      users.forEach(user => {
        cy.createUser(user)
      })

      cy.getUsers().then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.be.an('array')
        expect(response.body).to.have.length(3)
        
        // Valida schema da lista
        cy.validateUsersListSchema(response.body)

        // Valida cada usuário individualmente
        response.body.forEach((user, index) => {
          cy.validateUserSchema(user)
          expect(user.name).to.eq(users[index].name)
          expect(user.email).to.eq(users[index].email)
        })
      })
    })

    it('Deve validar lista com muitos usuários', () => {
      // Cria 10 usuários
      const users = Array.from({ length: 10 }, (_, i) => ({
        name: `User ${i + 1}`,
        email: `user${i + 1}@test.com`
      }))

      users.forEach(user => {
        cy.createUser(user)
      })

      cy.getUsers().then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.length(10)
        
        cy.validateUsersListSchema(response.body)

        // Verifica se todos os IDs são únicos e sequenciais
        const ids = response.body.map(user => user.id)
        expect(ids).to.deep.eq([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      })
    })
  })

  describe('Schema de Resposta - Atualização de Usuário', () => {
    it('Deve retornar schema válido ao atualizar usuário', () => {
      const originalUser = {
        name: 'Nome Original',
        email: 'original@test.com'
      }

      cy.createUserAndGetId(originalUser).then((userId) => {
        const updateData = {
          name: 'Nome Atualizado',
          email: 'atualizado@test.com'
        }

        cy.updateUser(userId, updateData).then((response) => {
          expect(response.status).to.eq(200)
          
          // Valida estrutura da resposta de atualização
          expect(response.body).to.have.property('message')
          expect(response.body).to.have.property('user')
          expect(response.body.message).to.be.a('string')

          // Valida schema do usuário retornado
          cy.validateUserSchema(response.body.user)

          expect(response.body.user.id).to.eq(userId)
          expect(response.body.user.name).to.eq(updateData.name)
          expect(response.body.user.email).to.eq(updateData.email)
        })
      })
    })

    it('Deve manter schema válido em atualizações parciais', () => {
      const originalUser = {
        name: 'Nome Original',
        email: 'original@test.com'
      }

      cy.createUserAndGetId(originalUser).then((userId) => {
        // Atualiza apenas nome
        cy.updateUser(userId, { name: 'Novo Nome' }).then((response) => {
          expect(response.status).to.eq(200)
          cy.validateUserSchema(response.body.user)
          expect(response.body.user.email).to.eq(originalUser.email)
        })

        // Atualiza apenas email
        cy.updateUser(userId, { email: 'novo@test.com' }).then((response) => {
          expect(response.status).to.eq(200)
          cy.validateUserSchema(response.body.user)
          expect(response.body.user.name).to.eq('Novo Nome') // Nome da atualização anterior
        })
      })
    })
  })

  describe('Schema de Resposta - Deleção de Usuário', () => {
    it('Deve retornar schema válido ao deletar usuário', () => {
      const userData = {
        name: 'Usuário para Deletar',
        email: 'deletar@test.com'
      }

      cy.createUserAndGetId(userData).then((userId) => {
        cy.deleteUser(userId).then((response) => {
          expect(response.status).to.eq(200)
          
          // Valida estrutura da resposta de deleção
          expect(response.body).to.have.property('message')
          expect(response.body).to.have.property('user')
          expect(response.body.message).to.be.a('string')

          // Valida schema do usuário deletado
          cy.validateUserSchema(response.body.user)

          expect(response.body.user.id).to.eq(userId)
          expect(response.body.user.name).to.eq(userData.name)
          expect(response.body.user.email).to.eq(userData.email)
        })
      })
    })
  })

  describe('Schema de Erro', () => {
    it('Deve retornar schema de erro válido para usuário não encontrado', () => {
      cy.getUserById(999).then((response) => {
        expect(response.status).to.eq(404)
        cy.validateErrorSchema(response.body)

        expect(response.body.error).to.eq('User not found.')
      })
    })

    it('Deve retornar schema de erro válido para dados inválidos', () => {
      const invalidData = { email: 'sem-nome@test.com' }

      cy.createUser(invalidData).then((response) => {
        expect(response.status).to.eq(400)
        cy.validateErrorSchema(response.body)

        expect(response.body.error).to.include('required')
      })
    })

    it('Deve retornar schema de erro válido para conflito', () => {
      const userData = {
        name: 'João Duplicado',
        email: 'joao@test.com'
      }

      cy.createUser(userData).then(() => {
        // Tenta criar usuário duplicado
        cy.createUser(userData).then((response) => {
          expect(response.status).to.eq(409)
          cy.validateErrorSchema(response.body)

          expect(response.body.error).to.include('already exists')
        })
      })
    })

    it('Deve retornar schema de erro válido para método não permitido', () => {
      cy.request({
        method: 'PATCH',
        url: `${Cypress.env('apiUrl')}/users`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(405)
        cy.validateErrorSchema(response.body)

        expect(response.body.error).to.eq('Invalid request method.')
      })
    })
  })

  describe('Validações de Formato de Dados', () => {
    it('Deve validar que ID é sempre número inteiro', () => {
      const userData = {
        name: 'Teste ID Format',
        email: 'id-format@test.com'
      }

      cy.createUser(userData).then((response) => {
        expect(response.status).to.eq(201)
        
        // ID deve ser número
        expect(response.body.id).to.be.a('number')
        expect(Number.isInteger(response.body.id)).to.be.true
        expect(response.body.id).to.be.greaterThan(0)
        
        cy.validateUserSchema(response.body)
      })
    })

    it('Deve validar que name é sempre string não vazia', () => {
      const testCases = [
        'Nome Simples',
        'Nome Com Espaços',
        'Nome-Com-Hífen',
        'Nome123ComNumeros',
        'ÀçentósEspeciáis'
      ]

      testCases.forEach((name, index) => {
        const userData = {
          name: name,
          email: `test${index}@example.com`
        }

        cy.createUser(userData).then((response) => {
          expect(response.status).to.eq(201)
          expect(response.body.name).to.be.a('string')
          expect(response.body.name).to.have.length.greaterThan(0)
          expect(response.body.name).to.eq(name)
          
          cy.validateUserSchema(response.body)
        })
      })
    })

    it('Deve validar que email é sempre string válida', () => {
      const validEmails = [
        'simple@test.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'test123@domain123.net'
      ]

      validEmails.forEach((email, index) => {
        const userData = {
          name: `User ${index}`,
          email: email
        }

        cy.createUser(userData).then((response) => {
          expect(response.status).to.eq(201)
          expect(response.body.email).to.be.a('string')
          expect(response.body.email).to.include('@')
          expect(response.body.email).to.eq(email)
          
          cy.validateUserSchema(response.body)
        })
      })
    })
  })

  describe('Consistência de Schema', () => {
    it('Schema deve ser consistente entre criação e busca', () => {
      const userData = {
        name: 'Consistência Schema',
        email: 'consistencia@test.com'
      }

      cy.createUser(userData).then((createResponse) => {
        const userId = createResponse.body.id
        cy.validateUserSchema(createResponse.body)

        cy.getUserById(userId).then((getResponse) => {
          cy.validateUserSchema(getResponse.body)
          
          // Dados devem ser idênticos
          expect(getResponse.body).to.deep.eq(createResponse.body)
        })
      })
    })

    it('Schema deve ser consistente entre atualizações', () => {
      const userData = {
        name: 'Teste Consistência',
        email: 'teste@test.com'
      }

      cy.createUserAndGetId(userData).then((userId) => {
        cy.updateUser(userId, { name: 'Nome Atualizado' }).then((updateResponse) => {
          cy.validateUserSchema(updateResponse.body.user)

          cy.getUserById(userId).then((getResponse) => {
            cy.validateUserSchema(getResponse.body)
            
            // Dados devem ser idênticos
            expect(getResponse.body).to.deep.eq(updateResponse.body.user)
          })
        })
      })
    })
  })
})
