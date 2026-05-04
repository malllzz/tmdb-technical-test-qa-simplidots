Cypress.on('uncaught:exception', (err, runnable) => {
  if (err.message.includes('ga is not defined')) {
    return false
  }
  return false
})

describe('Remove Movie from Favorite', () => {
  const BASE_URL = 'https://www.themoviedb.org'
  const POPULAR_MOVIES_URL = `${BASE_URL}/movie`

  const getUsername = () => Cypress.env('username')
  const getPassword = () => Cypress.env('password')

  // Helper
  const loginToTMDB = () => {
    cy.visit(`${BASE_URL}/login`)
    cy.url().should('include', '/login')
    cy.wait(1000)

    cy.get('#username').should('be.visible').clear().type(getUsername(), { delay: 50, log: false })
    cy.wait(500)
    cy.get('#password').should('be.visible').clear().type(getPassword(), { delay: 50, log: false })
    cy.wait(2000)

    cy.get('#login_button').click()
    cy.url({ timeout: 15000 }).should('include', `/u/${getUsername()}`)
  }
  const openFavoritesPage = () => {
    cy.intercept('POST', '/u/*/remote/account-list-check').as('accountCheckFav')
    cy.visit(`${BASE_URL}/u/${getUsername()}/favorites`)
    cy.url().should('include', 'favorite')
    cy.wait('@accountCheckFav', { timeout: 10000 })
  }

  // Setup
  beforeEach(() => {
    cy.session('tmdb-session', () => {
      loginToTMDB()
    })
  })

  // TC-REM-001
  it('TC-REM-001: Remove movie via Favorites list page', () => {
    openFavoritesPage()
    cy.intercept('PUT', '/u/*/remote/toggle-list-item').as('toggleFav')

    cy.get('.media-card-list .comp\\:media-card').then(($cardsBefore) => {
      const initialCount = $cardsBefore.length

      cy.get('.media-card-list .comp\\:media-card')
        .first()
        .find('a.account_list_action[data-list-type="favourite"][data-remove="true"]')
        .first()
        .click({ force: true })

      cy.wait('@toggleFav').its('response.statusCode').should('eq', 200)
      cy.wait(1000)

      cy.get('.media-card-list .comp\\:media-card').should('have.length', initialCount - 1)
    })

    cy.wait(2000)
    cy.screenshot('TC-REM-001-remove-from-fav-page')
  })

  // TC-REM-002
  it('TC-REM-002: Remove movie via Movie list page', () => {
    cy.intercept('POST', '/u/*/remote/account-list-check').as('accountCheckPop')
    cy.visit(POPULAR_MOVIES_URL)
    cy.wait('@accountCheckPop')

    cy.intercept('PUT', '/u/*/remote/toggle-list-item').as('toggleFav')
    cy.get('.comp\\:poster-card').first().find('.options a[aria-label="View Item Options"]').click({ force: true })

    cy.get('.k-tooltip:visible a.options_tooltip_link[data-list-type="favourite"]').then(($btn) => {
      if (!$btn.hasClass('selected')) {
        cy.wrap($btn).click({ force: true })
        cy.wait('@toggleFav')
        cy.get('.comp\\:poster-card').first().find('.options a[aria-label="View Item Options"]').click({ force: true })
      }

      cy.get('.k-tooltip:visible a.options_tooltip_link[data-list-type="favourite"]')
        .should('have.class', 'selected')
        .click({ force: true })

      cy.wait('@toggleFav').its('response.statusCode').should('eq', 200)

      cy.get('.comp\\:poster-card').first().find('.options a[aria-label="View Item Options"]').click({ force: true })
      cy.get('.k-tooltip:visible a.options_tooltip_link[data-list-type="favourite"]').should('not.have.class', 'selected')
    })

    cy.wait(2000)
    cy.screenshot('TC-REM-002-remove-from-movie-list')
  })

  // TC-REM-003
  it('TC-REM-003: Remove movie via Detail movie page', () => {
    cy.visit(POPULAR_MOVIES_URL)

    cy.get('.comp\\:poster-card').eq(0).find('h2 a').invoke('attr', 'href').then(href => {
      const targetMovieUrl = `${BASE_URL}${href}`
      cy.visit(targetMovieUrl)
      cy.intercept('PUT', '/u/*/remote/toggle-list-item').as('toggleFav')

      cy.get('a#favourite.add_to_account_list').as('favBtn')
      cy.get('@favBtn').find('.heart').should('have.class', 'true')

      cy.get('@favBtn').click({ force: true })
      cy.wait('@toggleFav').its('response.statusCode').should('eq', 200)

      cy.get('@favBtn').find('.heart').should('not.have.class', 'true')
    })

    cy.wait(2000)
    cy.screenshot('TC-REM-003-remove-from-detail-page')
  })

  // TC-REM-004
  it('TC-REM-004: Favorite status sync across pages', () => {
    cy.visit(POPULAR_MOVIES_URL)

    cy.get('.comp\\:poster-card').eq(1).find('h2 a').invoke('attr', 'href').then(href => {
      const targetMovieUrl = `${BASE_URL}${href}`

      openFavoritesPage()
      cy.intercept('PUT', '/u/*/remote/toggle-list-item').as('toggleFav')

      cy.get('.media-card-list .comp\\:media-card')
        .first()
        .find('a.account_list_action[data-list-type="favourite"][data-remove="true"]')
        .first()
        .click({ force: true })

      cy.wait('@toggleFav').its('response.statusCode').should('eq', 200)
      cy.wait(1000)

      cy.visit(targetMovieUrl)

      cy.get('a#favourite.add_to_account_list .heart').should('not.have.class', 'true')
    })

    cy.wait(2000)
    cy.screenshot('TC-REM-004-sync-across-pages')
  })

  // TC-REM-005
  it('TC-REM-005: Remove the last favorite movie', () => {
    openFavoritesPage()
    cy.intercept('PUT', '/u/*/remote/toggle-list-item').as('toggleFav')

    cy.get('.media-card-list .comp\\:media-card').should('have.length', 1)

    cy.get('.media-card-list .comp\\:media-card')
      .first()
      .find('a.account_list_action[data-list-type="favourite"][data-remove="true"]')
      .first()
      .click({ force: true })

    cy.wait('@toggleFav').its('response.statusCode').should('eq', 200)
    cy.wait(1500)

    cy.get('body').then(($body) => {
      expect($body.find('.comp\\:media-card').length).to.eq(0)
    })

    cy.contains('a.no_click', /Film|Movies/i, { timeout: 10000 })
      .should('be.visible')
      .should(($el) => {
        const text = $el.text()
        const countMatch = text.match(/\d+/)
        const count = countMatch ? countMatch[0] : '0'
        expect(count).to.eq('0')
      })

    cy.wait(2000)
    cy.screenshot('TC-REM-005-empty-state-after-remove')
  })
})