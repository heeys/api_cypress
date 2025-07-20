// cypress/e2e/api/users/users-negative.cy.js

describe('API Users - Cenários Negativos', () => {
  
  beforeEach(() => {
    // Limpa dados antes de cada teste
    cy.cleanupData()
  })

  after(() => {
    // Limpa dados após todos os testes
    cy.cleanupData()
  })

  describe('POST /users - Criar Usuário (Casos Negativos)', () => {
    it('Deve retornar erro 400 quando nome não é fornecido', () => {
      const userData = { email: 'teste@example.com' }

      cy.createUser(userData).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body).to.have.property('error')
        expect(response.body.error).to.eq('The fields name and email are required.')
        cy.validateErrorSchema(response.body)
      })
    })

    it('Deve retornar erro 400 quando email não é fornecido', () => {
      const userData = { name: 'Teste Silva' }

      cy.createUser(userData).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body).to.have.property('error')
        expect(response.body.error).to.eq('The fields name and email are required.')
        cy.validateErrorSchema(response.body)
      })
    })

    it('Deve retornar erro 400 quando nome é string vazia', () => {
      const userData = { name: '', email: 'teste@example.com' }

      cy.createUser(userData).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body).to.have.property('error')
        expect(response.body.error).to.eq('The fields name and email are required.')
      })
    })

    it('Deve retornar erro 400 quando email é string vazia', () => {
      const userData = { name: 'Teste Silva', email: '' }

      cy.createUser(userData).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body).to.have.property('error')
        expect(response.body.error).to.eq('The fields name and email are required.')
      })
    })

    it('Deve retornar erro 400 quando ambos os campos estão vazios', () => {
      const userData = { name: '', email: '' }

      cy.createUser(userData).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body).to.have.property('error')
        cy.validateErrorSchema(response.body)
      })
    })

    it('Deve retornar erro 409 quando nome já existe', () => {
      const userData = { name: 'João Duplicado', email: 'joao1@example.com' }
      const duplicateNameUser = { name: 'João Duplicado', email: 'joao2@example.com' }

      // Cria primeiro usuário
      cy.createUser(userData).then((response) => {
        expect(response.status).to.eq(201)

        // Tenta criar usuário com mesmo nome
        cy.createUser(duplicateNameUser).then((duplicateResponse) => {
          expect(duplicateResponse.status).to.eq(409)
          expect(duplicateResponse.body.error).to.eq('A user with this name or email already exists.')
          cy.validateErrorSchema(duplicateResponse.body)
        })
      })
    })

    it('Deve retornar erro 409 quando email já existe', () => {
      const userData = { name: 'João Silva', email: 'joao@example.com' }
      const duplicateEmailUser = { name: 'João Santos', email: 'joao@example.com' }

      // Cria primeiro usuário
      cy.createUser(userData).then((response) => {
        expect(response.status).to.eq(201)

        // Tenta criar usuário com mesmo email
        cy.createUser(duplicateEmailUser).then((duplicateResponse) => {
          expect(duplicateResponse.status).to.eq(409)
          expect(duplicateResponse.body.error).to.eq('A user with this name or email already exists.')
          cy.validateErrorSchema(duplicateResponse.body)
        })
      })
    })

    it('Deve retornar erro 409 quando nome e email já existem', () => {
      const userData = { name: 'João Silva', email: 'joao@example.com' }

      // Cria primeiro usuário
      cy.createUser(userData).then((response) => {
        expect(response.status).to.eq(201)

        // Tenta criar usuário idêntico
        cy.createUser(userData).then((duplicateResponse) => {
          expect(duplicateResponse.status).to.eq(409)
          expect(duplicateResponse.body.error).to.eq('A user with this name or email already exists.')
        })
      })
    })

    it('Deve rejeitar body vazio', () => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/users`,
        body: {},
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400)
        cy.validateErrorSchema(response.body)
      })
    })

    it('Deve rejeitar campos extras no body', () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@example.com',
        extraField: 'não deveria aceitar',
        id: 999 // Usuário não deveria poder definir ID
      }

      cy.createUser(userData).then((response) => {
        expect(response.status).to.eq(201)
        // ID deve ser gerado automaticamente, não o fornecido
        expect(response.body.id).to.not.eq(999)
        expect(response.body.id).to.eq(1)
        // Campo extra não deve aparecer na resposta
        expect(response.body).to.not.have.property('extraField')
      })
    })
  })

  describe('GET /users/:id - Buscar Usuário (Casos Negativos)', () => {
    it('Deve retornar erro 404 para usuário inexistente', () => {
      cy.getUserById(999).then((response) => {
        expect(response.status).to.eq(404)
        expect(response.body).to.have.property('error')
        expect(response.body.error).to.eq('User not found.')
        cy.validateErrorSchema(response.body)
      })
    })

    it('Deve retornar erro 404 para ID negativo', () => {
      cy.getUserById(-1).then((response) => {
        expect(response.status).to.eq(404)
        expect(response.body.error).to.eq('User not found.')
      })
    })

    it('Deve retornar erro 404 para ID zero', () => {
      cy.getUserById(0).then((response) => {
        expect(response.status).to.eq(404)
        expect(response.body.error).to.eq('User not found.')
      })
    })

    it('Deve tratar ID string como não encontrado', () => {
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/users/abc`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(404)
        cy.validateErrorSchema(response.body)
      })
    })

    it('Deve tratar ID muito grande', () => {
      cy.getUserById(999999999).then((response) => {
        expect(response.status).to.eq(404)
        expect(response.body.error).to.eq('User not found.')
      })
    })
  })

  describe('PUT /users/:id - Atualizar Usuário (Casos Negativos)', () => {
    it('Deve retornar erro 404 para usuário inexistente', () => {
      const updateData = { name: 'Nome Atualizado' }

      cy.updateUser(999, updateData).then((response) => {
        expect(response.status).to.eq(404)
        expect(response.body).to.have.property('error')
        expect(response.body.error).to.eq('User not found.')
        cy.validateErrorSchema(response.body)
      })
    })

    it('Deve aceitar body vazio (sem alterações)', () => {
      const userData = { name: 'João Silva', email: 'joao@test.com' }

      cy.createUserAndGetId(userData).then((userId) => {
        cy.updateUser(userId, {}).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body.user.name).to.eq(userData.name)
          expect(response.body.user.email).to.eq(userData.email)
        })
      })
    })

    it('Deve ignorar tentativa de alterar ID', () => {
      const userData = { name: 'João Silva', email: 'joao@test.com' }
      const updateData = { id: 999, name: 'Nome Atualizado' }

      cy.createUserAndGetId(userData).then((userId) => {
        cy.updateUser(userId, updateData).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body.user.id).to.eq(userId) // ID original deve permanecer
          expect(response.body.user.name).to.eq(updateData.name)
        })
      })
    })

    it('Deve aceitar campos null (sem alteração)', () => {
      const userData = { name: 'João Silva', email: 'joao@test.com' }
      const updateData = { name: null, email: null }

      cy.createUserAndGetId(userData).then((userId) => {
        cy.updateUser(userId, updateData).then((response) => {
          expect(response.status).to.eq(200)
          // Valores originais devem permanecer
          expect(response.body.user.name).to.eq(userData.name)
          expect(response.body.user.email).to.eq(userData.email)
        })
      })
    })
  })

  describe('DELETE /users/:id - Deletar Usuário (Casos Negativos)', () => {
    it('Deve retornar erro 404 para usuário inexistente', () => {
      cy.deleteUser(999).then((response) => {
        expect(response.status).to.eq(404)
        expect(response.body).to.have.property('error')
        expect(response.body.error).to.eq('User not found.')
        cy.validateErrorSchema(response.body)
      })
    })

    it('Deve retornar erro 404 ao tentar deletar usuário já deletado', () => {
      const userData = { name: 'Usuário para Deletar', email: 'deletar@test.com' }

      cy.createUserAndGetId(userData).then((userId) => {
        // Primeira deleção deve funcionar
        cy.deleteUser(userId).then((response) => {
          expect(response.status).to.eq(200)
        })

        // Segunda deleção deve falhar
        cy.deleteUser(userId).then((secondResponse) => {
          expect(secondResponse.status).to.eq(404)
          expect(secondResponse.body.error).to.eq('User not found.')
        })
      })
    })

    it('Deve retornar erro 404 para ID negativo', () => {
      cy.deleteUser(-1).then((response) => {
        expect(response.status).to.eq(404)
        expect(response.body.error).to.eq('User not found.')
      })
    })

    it('Deve retornar erro 404 para ID zero', () => {
      cy.deleteUser(0).then((response) => {
        expect(response.status).to.eq(404)
        expect(response.body.error).to.eq('User not found.')
      })
    })
  })

  describe('Métodos HTTP Inválidos', () => {
    it('Deve retornar erro 405 para método PATCH em /users', () => {
      cy.request({
        method: 'PATCH',
        url: `${Cypress.env('apiUrl')}/users`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(405)
        expect(response.body.error).to.eq('Invalid request method.')
      })
    })

    it('Deve retornar erro 405 para método POST em /users/:id', () => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/users/1`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(405)
        expect(response.body.error).to.eq('Invalid request method.')
      })
    })

    it('Deve retornar erro 405 para método PATCH em /users/:id', () => {
      cy.request({
        method: 'PATCH',
        url: `${Cypress.env('apiUrl')}/users/1`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(405)
        expect(response.body.error).to.eq('Invalid request method.')
      })
    })
  })

  describe('Validações de Content-Type', () => {
    it('Deve aceitar application/json', () => {
      const userData = { name: 'Teste', email: 'teste@example.com' }

      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/users`,
        headers: {
          'Content-Type': 'application/json'
        },
        body: userData,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(201)
      })
    })

    it('Deve processar requisição sem Content-Type', () => {
      const userData = { name: 'Teste', email: 'teste@example.com' }

      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/users`,
        body: userData,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(201)
      })
    })
  })

  describe('Teste de Limites e Edge Cases', () => {
    it('Deve processar nomes com caracteres especiais', () => {
      const userData = {
        name: 'João da Silva & Cia. Ltda.',
        email: 'joao@example.com'
      }

      cy.createUser(userData).then((response) => {
        expect(response.status).to.eq(201)
        expect(response.body.name).to.eq(userData.name)
      })
    })

    it('Deve processar emails com diferentes formatos válidos', () => {
      const testCases = [
        { name: 'User 1', email: 'user@domain.com' },
        { name: 'User 2', email: 'user.name@domain.com' },
        { name: 'User 3', email: 'user+tag@domain.com' },
        { name: 'User 4', email: 'user123@domain123.com' }
      ]

      testCases.forEach((userData, index) => {
        cy.createUser(userData).then((response) => {
          expect(response.status).to.eq(201)
          expect(response.body.email).to.eq(userData.email)
        })
      })
    })
  })
})
