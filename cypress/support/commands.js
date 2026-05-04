Cypress.Commands.add('loginTMDB', () => {
  const username = Cypress.env('username')
  const password = Cypress.env('password')

  cy.contains('a', 'Masuk', { timeout: 10000 }).click()
  cy.url().should('include', '/login')

  cy.get('#username').should('be.visible').type(username, { log: false })
  cy.get('#password').should('be.visible').type(password, { log: false })

  cy.get('#login_button').click()
  cy.url().should('include', `/u/${username}`)
})