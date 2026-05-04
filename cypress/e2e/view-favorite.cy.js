describe('View Favorite Movie List', () => {
  const BASE_URL = 'https://www.themoviedb.org'
  const POPULAR_MOVIES_URL = `${BASE_URL}/movie`

  const getUsername = () => Cypress.env('username')
  const getPassword = () => Cypress.env('password')
  const getEmptyUsername = () => Cypress.env('empty_username')
  const getEmptyPassword = () => Cypress.env('empty_password')

  // Helpers
  const acceptCookiesIfAny = () => {
    cy.get('body').then(($body) => {
      if ($body.find('#onetrust-accept-btn-handler').length) {
        cy.get('#onetrust-accept-btn-handler').click()
      }
    })
  }

  const login = (username = getUsername(), password = getPassword()) => {
    cy.contains('a', /Masuk|Login/i, { timeout: 10000 }).click()
    cy.url().should('include', '/login')

    cy.get('#username').should('be.visible').type(username, { log: false })
    cy.get('#password').should('be.visible').type(password, { log: false })
    cy.get('#login_button').click()

    cy.url().should('include', `/u/${username}`)
  }

  const openPopularMoviesLoggedIn = () => {
    cy.intercept('POST', '/u/*/remote/account-list-check').as('accountCheck')
    cy.visit(POPULAR_MOVIES_URL)
    cy.url().should('include', '/movie')
    cy.wait('@accountCheck')
  }

  const openFavoritesPage = (username = getUsername()) => {
    cy.visit(`${BASE_URL}/u/${username}/favorites`)
    cy.url().should('include', 'favorite')
  }

  const ensureFavoriteFromCardIndex = (index) => {
    cy.intercept('PUT', '/u/*/remote/toggle-list-item').as('toggleFavorite')

    const openOptions = () => {
      cy.get('.comp\\:poster-card').eq(index)
        .find('.options a[aria-label="View Item Options"]')
        .click({ force: true })
    }

    const clickFavorite = () => {
      cy.get('a.options_tooltip_link[data-list-type="favourite"]')
        .should('be.visible')
        .first()
        .click({ force: true })

      cy.wait('@toggleFavorite').its('response.statusCode').should('eq', 200)
      cy.get('.notification.success', { timeout: 10000 }).should('be.visible')
    }

    openOptions()

    cy.get('a.options_tooltip_link[data-list-type="favourite"]').then(($link) => {
      if ($link.hasClass('selected')) {
        clickFavorite()
        openOptions()
      }
      clickFavorite()
    })
  }

  const addNewFavoriteFromCardIndex = (index) => {
    cy.intercept('PUT', '/u/*/remote/toggle-list-item').as('toggleFavorite')

    cy.get('.comp\\:poster-card').eq(index)
      .find('.options a[aria-label="View Item Options"]')
      .click({ force: true })

    return cy.get('.k-tooltip:visible a.options_tooltip_link[data-list-type="favourite"]')
      .should('be.visible')
      .then(($link) => {
        if ($link.hasClass('selected')) {
          cy.get('body').type('{esc}')
          return cy.wrap(false)
        }

        cy.wrap($link).click({ force: true })
        cy.wait('@toggleFavorite').its('response.statusCode').should('eq', 200)
        cy.get('.notification.success', { timeout: 10000 }).should('be.visible')
        return cy.wrap(true)
      })
  }

  const addFirstNewFavorite = (startIndex) => {
    return getMovieTitleFromCardIndex(startIndex).then((title) => {
      return addNewFavoriteFromCardIndex(startIndex).then((added) => {
        if (added) return { index: startIndex, title }
        return addFirstNewFavorite(startIndex + 1)
      })
    })
  }

  const getMovieTitleFromCardIndex = (index) => {
    return cy.get('.comp\\:poster-card').eq(index)
      .find('h2 span')
      .invoke('text')
      .then((t) => t.trim())
  }

  const assertMovieInFavorites = (title) => {
    cy.get('.media-card-list .comp\\:media-card', { timeout: 10000 })
      .should('have.length.at.least', 1)

    cy.get('.media-card-list .comp\\:media-card h2 span')
      .contains(title)
      .should('exist')
  }

  const assertEmptyFavoritesState = () => {
    cy.contains('a.no_click', /Film|Movies/i, { timeout: 10000 })
      .should('be.visible')
      .should(($el) => {
        const text = $el.text()
        const countMatch = text.match(/\d+/)
        const count = countMatch ? countMatch[0] : '0'

        expect(count).to.eq('0')
      })

    cy.get('body').then(($body) => {
      expect($body.find('.comp\\:media-card').length).to.eq(0)
    })
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

  // Setup
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.visit(BASE_URL)
    acceptCookiesIfAny()
  })

  // TC-VIEW-001
  it('User accesses favorite movie page', () => {
    login()
    openFavoritesPage()
    cy.get('body').should('be.visible')

    cy.wait(3000)
    cy.screenshot('view-fav-page')
  })

  // TC-VIEW-002
  it('Favorite movie information is consistent', () => {
    login()
    openPopularMoviesLoggedIn()

    getMovieTitleFromCardIndex(7).then((title) => {
      ensureFavoriteFromCardIndex(7)

      openFavoritesPage()
      cy.intercept('POST', '/u/*/remote/account-list-check').as('accountCheck')
      cy.wait('@accountCheck')

      assertMovieInFavorites(title)

      cy.wait(3000)
      cy.screenshot('view-fav-info-consistent')
    })
  })

  // TC-VIEW-003
  it('TC-VIEW-003: Favorite list shows latest added movie first', () => {
    login()
    clearAllFavorites()
    openPopularMoviesLoggedIn()

    addFirstNewFavorite(7).then(({ title: firstTitle }) => {
      cy.wait(2000)
      addFirstNewFavorite(8).then(({ title: secondTitle }) => {
        cy.visit(`${BASE_URL}/u/${getUsername()}/favorites/movie?sort_by=created_at&sort_order=desc`)
        cy.intercept('POST', '/u/*/remote/account-list-check').as('accountCheck')
        cy.wait('@accountCheck')

        cy.get('.media-card-list .comp\\:media-card')
          .first()
          .find('a.font-normal h2 span')
          .first()
          .invoke('text')
          .then((text) => {
            expect(text.trim()).to.include(secondTitle)
          })

        assertMovieInFavorites(firstTitle)

        cy.wait(3000)
        cy.screenshot('view-fav-sort')
      })
    })
  })

  // TC-VIEW-004
  it('User views empty favorite list', () => {
    login(getEmptyUsername(), getEmptyPassword())
    openFavoritesPage(getEmptyUsername())
    assertEmptyFavoritesState()

    cy.wait(3000)
    cy.screenshot('view-empty-fav')
  })

  // TC-VIEW-005
  it('User tries to access favorite list without login', () => {
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.visit(`${BASE_URL}/u/${getUsername()}/favorites`, { failOnStatusCode: false })
    cy.contains('This page is private').should('be.visible')
    cy.contains("You've tried to request a page that is private").should('be.visible')

    cy.wait(3000)
    cy.screenshot('view-fav-not-logged-in')
  })
})