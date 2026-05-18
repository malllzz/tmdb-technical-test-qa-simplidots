Cypress.on('uncaught:exception', (err, runnable) => {
  if (err.message.includes('ga is not defined')) return false
  return false
})

describe('Remove Movie from Favorite', () => {
  const BASE_URL = 'https://www.themoviedb.org'
  const POPULAR_MOVIES_URL = `${BASE_URL}/movie`

  const getUsername = () => Cypress.env('username')
  const getPassword = () => Cypress.env('password')

  // =======================
  // Helpers
  // =======================
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
    cy.visit(`${BASE_URL}/u/${getUsername()}/favorites`)
    cy.url().should('include', 'favorite')
    cy.get('body', { timeout: 10000 }).should('be.visible')
  }

  const clearAllFavorites = () => {
    openFavoritesPage()
    cy.intercept('PUT', '**/toggle-list-item*').as('toggleFav')

    const removeOne = () => {
      cy.get('body').then(($body) => {
        const count = $body.find('.media-card-list .comp\\:media-card').length
        if (count === 0) return

        cy.get('.media-card-list .comp\\:media-card')
          .first()
          .find('a.account_list_action[data-list-type="favourite"][data-remove="true"]')
          .first()
          .click({ force: true })

        cy.wait('@toggleFav')
        cy.wait(500)
        removeOne()
      })
    }

    removeOne()
  }

  const ensureAtLeastOneFavorite = () => {
    openFavoritesPage()
    cy.get('body').then(($body) => {
      const count = $body.find('.media-card-list .comp\\:media-card').length
      if (count > 0) return

      // ambil movie pertama dari list dan favorite dari detail page
      cy.visit(POPULAR_MOVIES_URL)
      cy.get('.comp\\:poster-card').first()
        .find('a[href^="/movie/"]')
        .first()
        .invoke('attr', 'href')
        .then((href) => {
          cy.visit(`${BASE_URL}${href}`)

          cy.intercept('PUT', '**/toggle-list-item*').as('toggleFav')
          cy.get('a#favourite.add_to_account_list', { timeout: 10000 })
            .click({ force: true })

          cy.wait('@toggleFav')
          openFavoritesPage()
        })
    })
  }

  const ensureExactlyOneFavorite = () => {
    clearAllFavorites()
    ensureAtLeastOneFavorite()
  }

  const getFirstFavoriteMovieLink = () => {
    return cy.get('.media-card-list .comp\\:media-card')
      .first()
      .find('a[href^="/movie/"]')
      .first()
      .invoke('attr', 'href')
  }

  // =======================
  // Setup
  // =======================
  beforeEach(() => {
    cy.session('tmdb-session', () => {
      loginToTMDB()
    })
  })

  // =======================
  // TC-REM-001
  // =======================
  it('TC-REM-001: Remove movie via Favorites list page', () => {
    ensureAtLeastOneFavorite()
    openFavoritesPage()
    cy.intercept('PUT', '**/toggle-list-item*').as('toggleFav')

    cy.get('.media-card-list .comp\\:media-card').then(($cards) => {
      const initialCount = $cards.length

      cy.get('.media-card-list .comp\\:media-card')
        .first()
        .find('a.account_list_action[data-list-type="favourite"][data-remove="true"]')
        .first()
        .click({ force: true })

      cy.wait('@toggleFav').its('response.statusCode').should('eq', 200)
      cy.get('.media-card-list .comp\\:media-card')
        .should('have.length', initialCount - 1)
    })

    cy.screenshot('TC-REM-001-remove-from-fav-page')
  })

  // =======================
  // TC-REM-002
  // =======================
  it('TC-REM-002: Remove movie via Movie list page', () => {
    cy.visit(POPULAR_MOVIES_URL)

    cy.get('.comp\\:poster-card').first().find('h2 span').invoke('text').then((title) => {
      const movieTitle = title.trim()

      cy.intercept('PUT', '**/toggle-list-item*').as('toggleFav')

      const openOptions = () => {
        cy.get('.comp\\:poster-card').first()
          .find('.options a[aria-label="View Item Options"]')
          .click({ force: true })
      }

      openOptions()

      cy.get('body').then(($body) => {
        if ($body.find('.k-tooltip:visible a.options_tooltip_link[data-list-type="favourite"]').length === 0) {
          openOptions()
        }
      })

      cy.get('.k-tooltip:visible a.options_tooltip_link[data-list-type="favourite"]', { timeout: 10000 })
        .then(($btn) => {
          if (!$btn.hasClass('selected')) {
            cy.wrap($btn).click({ force: true })
            cy.wait('@toggleFav')
            openOptions()
          }

          cy.get('.k-tooltip:visible a.options_tooltip_link[data-list-type="favourite"]')
            .click({ force: true })

          cy.wait('@toggleFav')
        })

      openFavoritesPage()
      cy.get('body').then(($body) => {
        const exists = $body.find('.media-card-list .comp\\:media-card h2 span')
          .toArray()
          .some((el) => el.innerText.includes(movieTitle))

        expect(exists).to.eq(false)
      })
    })

    cy.screenshot('TC-REM-002-remove-from-movie-list')
  })

  // =======================
  // TC-REM-003
  // =======================
  it('TC-REM-003: Remove movie via Detail movie page', () => {
    ensureAtLeastOneFavorite()
    openFavoritesPage()

    getFirstFavoriteMovieLink().then((href) => {
      cy.visit(`${BASE_URL}${href}`)

      cy.intercept('PUT', '**/toggle-list-item*').as('toggleFav')
      cy.get('a#favourite.add_to_account_list', { timeout: 10000 }).as('favBtn')

      // remove
      cy.get('@favBtn').click({ force: true })
      cy.wait('@toggleFav').its('response.statusCode').should('eq', 200)

      cy.get('@favBtn').find('.heart').should('not.have.class', 'true')

      // pastikan hilang di favorites
      openFavoritesPage()
      cy.get('body').then(($body) => {
        expect($body.find(`a[href="${href}"]`).length).to.eq(0)
      })
    })

    cy.screenshot('TC-REM-003-remove-from-detail-page')
  })

  // =======================
  // TC-REM-004
  // =======================
  it('TC-REM-004: Favorite status sync across pages', () => {
    ensureAtLeastOneFavorite()
    openFavoritesPage()

    getFirstFavoriteMovieLink().then((href) => {
      // remove dari favorites
      cy.intercept('PUT', '**/toggle-list-item*').as('toggleFav')
      cy.get('.media-card-list .comp\\:media-card')
        .first()
        .find('a.account_list_action[data-list-type="favourite"][data-remove="true"]')
        .first()
        .click({ force: true })

      cy.wait('@toggleFav').its('response.statusCode').should('eq', 200)

      // buka detail movie yg sama
      cy.visit(`${BASE_URL}${href}`)
      cy.get('a#favourite.add_to_account_list .heart')
        .should('not.have.class', 'true')
    })

    cy.screenshot('TC-REM-004-sync-across-pages')
  })

  // =======================
  // TC-REM-005
  // =======================
  it('TC-REM-005: Remove the last favorite movie', () => {
    ensureExactlyOneFavorite()
    openFavoritesPage()
    cy.intercept('PUT', '**/toggle-list-item*').as('toggleFav')

    cy.get('.media-card-list .comp\\:media-card')
      .first()
      .find('a.account_list_action[data-list-type="favourite"][data-remove="true"]')
      .first()
      .click({ force: true })

    cy.wait('@toggleFav')

    cy.contains('a.no_click', /Film|Movies/i, { timeout: 10000 })
      .should(($el) => {
        const text = $el.text()
        const count = text.match(/\d+/)?.[0] ?? '0'
        expect(count).to.eq('0')
      })

    cy.screenshot('TC-REM-005-empty-state-after-remove')
  })
})