Cypress.on('uncaught:exception', (err, runnable) => {
  if (err.message.includes('ga is not defined')) {
    return false
  }
  return false
})

describe('Sort Favorite Movie List', () => {
  const BASE_URL = 'https://www.themoviedb.org'
  const POPULAR_MOVIES_URL = `${BASE_URL}/movie`

  const getUsername = () => Cypress.env('username')
  const getPassword = () => Cypress.env('password')

  // Helpers 
  const acceptCookiesIfAny = () => {
    cy.get('body').then(($body) => {
      if ($body.find('#onetrust-accept-btn-handler').length) {
        cy.get('#onetrust-accept-btn-handler').click()
      }
    })
  }

  const login = (username = getUsername(), password = getPassword()) => {
    cy.visit(`${BASE_URL}/login`)
    cy.url().should('include', '/login')
    cy.wait(1000)

    cy.get('#username').should('be.visible').clear().type(username, { delay: 50, log: false })
    cy.wait(500)

    cy.get('#password').should('be.visible').clear().type(password, { delay: 50, log: false })
    cy.wait(2000)

    cy.get('#login_button').click()
    cy.url({ timeout: 15000 }).should('include', `/u/${username}`)
  }

  const logout = () => {
    cy.get('a[title="Profil dan Pengaturan"]').click({ force: true })
    cy.get('.k-tooltip-content a[href="/logout"]').click({ force: true })
    cy.url({ timeout: 15000 }).should('not.include', '/u/')
  }

  const openFavoritesPage = (username = getUsername()) => {
    cy.visit(`${BASE_URL}/u/${username}/favorites`)
    cy.url().should('include', 'favorite')
  }

  const clearAllFavorites = () => {
    cy.intercept('POST', '/u/*/remote/account-list-check').as('accountCheck')
    openFavoritesPage()
    cy.wait('@accountCheck')

    cy.get('body').then(($body) => {
      if ($body.find('.media-card-list .comp\\:media-card').length === 0) return

      cy.intercept('PUT', '/u/*/remote/toggle-list-item').as('toggleFavorite')

      const removeFirst = () => {
        cy.get('.media-card-list .comp\\:media-card')
          .first()
          .find('a.account_list_action[data-list-type="favourite"][data-remove="true"]')
          .first()
          .click({ force: true })

        cy.wait('@toggleFavorite')
        cy.wait(500)
        cy.get('body').then(($body2) => {
          if ($body2.find('.media-card-list .comp\\:media-card').length > 0) {
            removeFirst()
          }
        })
      }
      removeFirst()
    })
  }

  const setupMultipleFavorites = () => {
    clearAllFavorites()

    cy.intercept('POST', '/u/*/remote/account-list-check').as('accountCheckPop')
    cy.visit(POPULAR_MOVIES_URL)
    cy.wait('@accountCheckPop')

    for (let i = 0; i < 3; i++) {
      cy.intercept('PUT', '/u/*/remote/toggle-list-item').as('toggleFav')
      cy.get('.comp\\:poster-card').eq(i).find('.options a[aria-label="View Item Options"]').click({ force: true })

      cy.get('.k-tooltip:visible a.options_tooltip_link[data-list-type="favourite"]')
        .should('be.visible')
        .then(($link) => {
          if (!$link.hasClass('selected')) {
            cy.wrap($link).click({ force: true })
            cy.wait('@toggleFav').its('response.statusCode').should('eq', 200)
            cy.get('.notification.success', { timeout: 10000 }).should('be.visible')
          } else {
            cy.get('body').type('{esc}')
          }
        })
      cy.wait(1500)
    }
  }

  const selectSortOptionUI = (sortByDataAttribute) => {
    cy.get('.group_dropdown.filters .sort_text:not(.hide)').click({ force: true })
    cy.get(`ul.filters a[data-sort-by="${sortByDataAttribute}"]`).click({ force: true })
    cy.url().should('include', `sort_by=${sortByDataAttribute}`)
    cy.get('.media-card-list .comp\\:media-card', { timeout: 10000 }).should('have.length.at.least', 1)
  }

  // Setup
  before(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.visit(BASE_URL)
    acceptCookiesIfAny()
    login()
    setupMultipleFavorites()
  })

  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.visit(BASE_URL)
    acceptCookiesIfAny()
    login()
  })

  // TC-SORT-001
  it('TC-SORT-001: Sort favorite movies by popularity', () => {
    openFavoritesPage()
    selectSortOptionUI('popularity')

    cy.wait(3000)
    cy.screenshot('sorting-popularity')
  })

  // TC-SORT-002
  it('TC-SORT-002: Sort favorite movies by release date', () => {
    openFavoritesPage()
    selectSortOptionUI('release_date')

    cy.wait(3000)
    cy.screenshot('sorting-release-date')
  })

  // TC-SORT-003
  it('TC-SORT-003: Sort favorite movies by date added', () => {
    openFavoritesPage()
    selectSortOptionUI('created_at')

    cy.wait(3000)
    cy.screenshot('sorting-date-added')
  })

  // TC-SORT-004
  it('TC-SORT-004: Sorting resets to default after logout and login', () => {
    openFavoritesPage()
    selectSortOptionUI('popularity')

    logout()
    cy.wait(2000)

    login()
    openFavoritesPage()

    cy.url().should('not.include', 'sort_by=popularity')

    cy.get('#sort_by_popularity').should('have.class', 'hide')
    cy.get('#sort_by_created_at').should('not.have.class', 'hide')

    cy.get('.media-card-list .comp\\:media-card').should('have.length.at.least', 1)

    cy.wait(3000)
    cy.screenshot('sorting-default-reset')
  })

  // TC-SORT-005
  it('TC-SORT-005: User selects invalid sorting option', () => {
    cy.visit(`${BASE_URL}/u/${getUsername()}/favorites/movie?sort_by=invalid_value_123`, { failOnStatusCode: false })
    cy.contains("Uh-oh! That's not a valid request!").should('be.visible')
    cy.contains("This request could not be completed.").should('be.visible')

    cy.wait(3000)
    cy.screenshot('invalid-option-error-page')
  })
})