describe('Mark Movie as Favorite', () => {
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

  const login = () => {
    cy.contains('a', 'Masuk', { timeout: 10000 }).click()
    cy.url().should('include', '/login')

    cy.get('#username').should('be.visible').type(getUsername(), { log: false })
    cy.get('#password').should('be.visible').type(getPassword(), { log: false })
    cy.get('#login_button').click()

    cy.url().should('include', `/u/${getUsername()}`)
  }

  const openPopularMovies = () => {
    cy.visit(POPULAR_MOVIES_URL)
    cy.url().should('include', '/movie')
  }

  const openPopularMoviesLoggedIn = () => {
    cy.intercept('POST', '/u/*/remote/account-list-check').as('accountCheck')

    cy.visit(POPULAR_MOVIES_URL)
    cy.url().should('include', '/movie')

    cy.wait('@accountCheck')
  }

  const getFirstMovieCard = () => cy.get('.comp\\:poster-card').first()

  const getMovieTitleFromCard = () =>
    getFirstMovieCard().find('h2 span').invoke('text').then((t) => t.trim())

  const openCardOptionsMenu = () => {
    getFirstMovieCard()
      .find('.options a[aria-label="View Item Options"]')
      .click({ force: true })
  }

  const clickFavoriteFromCardOptions = () => {
    cy.intercept('PUT', '/u/*/remote/toggle-list-item').as('toggleFavorite')

    cy.get('a.options_tooltip_link[data-list-type="favourite"]')
      .contains(/Favorite|Kesukaan/i)
      .click({ force: true })

    cy.wait('@toggleFavorite').its('response.statusCode').should('eq', 200)
  }

  const assertSuccessToast = () => {
    cy.get('.notification.success', { timeout: 10000 })
      .should('be.visible')
  }

  const assertCardFavoriteActive = () => {
    cy.get('a.options_tooltip_link.selected[data-list-type="favourite"]')
      .should('exist')
  }

  const assertCardFavoriteInactive = () => {
    cy.get('a.options_tooltip_link.selected[data-list-type="favourite"]')
      .should('not.exist')
  }

  const openFirstMovieDetail = () => {
    getFirstMovieCard().find('a[data-media-type="movie"]').first().click()
    cy.url().should('include', '/movie/')
  }

  const clickFavoriteOnDetail = () => {
    cy.get('a#favourite').click({ force: true })
  }

  const assertDetailFavoriteActive = () => {
    cy.get('a#favourite span.heart.white.true').should('exist')
  }

  const assertDetailFavoriteInactive = () => {
    cy.get('a#favourite span.heart.white.false').should('exist')
  }

  const openFavoritesPage = () => {
    cy.visit(`${BASE_URL}/u/${getUsername()}/favorites`)
    cy.url().should('include', 'favorite')
  }

  const assertMovieInFavorites = (title) => {
    cy.contains(title, { timeout: 10000 }).should('exist')
  }

  const assertMovieNotInFavorites = (title) => {
    cy.contains(title).should('not.exist')
  }

  const assertLoginPrompt = () => {
    cy.get('.k-tooltip-content', { timeout: 10000 })
      .should('be.visible')
      .invoke('text')
      .then((text) => {
        expect(text).to.match(/Login to add this movie to your favorite list|Masuk untuk menambahkan film ke daftar sukaan/i)
      })
  }

  // Setup
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.visit(BASE_URL)
    acceptCookiesIfAny()
  })

  // TC-FAV-001
  it('should add movie to favorite from movie listing page', () => {
    login()
    openPopularMoviesLoggedIn()

    getMovieTitleFromCard().then((movieTitle) => {
      openCardOptionsMenu()
      clickFavoriteFromCardOptions()

      assertSuccessToast()
      cy.wait(2000)
      cy.screenshot('favorite-toast-success-list')

      assertCardFavoriteActive()

      openFavoritesPage()
      assertMovieInFavorites(movieTitle)
      cy.wait(2000)
      cy.screenshot('favorite-list-verified')
    })
  })

  // TC-FAV-002
  it('should add movie to favorite from movie detail page', () => {
    login()
    openPopularMoviesLoggedIn()

    cy.get('.comp\\:poster-card').eq(1).as('secondCard')

    cy.get('@secondCard').find('h2 span').invoke('text').then((movieTitle) => {
      cy.get('@secondCard').find('a[data-media-type="movie"]').first().click()
      cy.url().should('include', '/movie/')

      clickFavoriteOnDetail()
      assertDetailFavoriteActive()
      cy.wait(2000)
      cy.screenshot('favorite-detail-active')

      openFavoritesPage()
      assertMovieInFavorites(movieTitle.trim())
      cy.wait(2000)
      cy.screenshot('favorite-detail-listed')
    })
  })

  // TC-FAV-003
  it('should prompt login when trying to favorite without login', () => {
    openPopularMovies()
    openFirstMovieDetail()
    clickFavoriteOnDetail()

    assertLoginPrompt()
    cy.wait(2000)
    cy.screenshot('favorite-login-prompt')
  })


  // TC-FAV-004
  it('should add multiple movies sequentially to favorites', () => {
    login()
    openPopularMoviesLoggedIn()

    cy.get('.comp\\:poster-card').eq(2).as('thirdCard')
    cy.get('.comp\\:poster-card').eq(3).as('fourthCard')

    const addFavoriteFromCard = (cardAlias) => {
      cy.intercept('PUT', '/u/*/remote/toggle-list-item').as('toggleFavorite')

      cy.get(cardAlias).find('.options a[aria-label="View Item Options"]').click({ force: true })
      cy.get('a.options_tooltip_link[data-list-type="favourite"]')
        .contains(/Favorite|Kesukaan/i)
        .click({ force: true })

      cy.wait('@toggleFavorite').its('response.statusCode').should('eq', 200)
      assertSuccessToast()
    }

    cy.get('@thirdCard').find('h2 span').invoke('text').then((firstTitle) => {
      addFavoriteFromCard('@thirdCard')

      cy.get('@fourthCard').find('h2 span').invoke('text').then((secondTitle) => {
        addFavoriteFromCard('@fourthCard')

        openFavoritesPage()
        assertMovieInFavorites(firstTitle.trim())
        assertMovieInFavorites(secondTitle.trim())
        cy.wait(3000)
        cy.screenshot('favorite-multiple-verified')
      })
    })
  })

  // TC-FAV-005
  it('should remove favorite when clicked again on same movie', () => {
    login()
    openPopularMoviesLoggedIn()

    cy.get('.comp\\:poster-card').eq(4).as('fifthCard')

    const toggleFavoriteFromCard = (cardAlias) => {
      cy.intercept('PUT', '/u/*/remote/toggle-list-item').as('toggleFavorite')

      cy.get(cardAlias)
        .find('.options a[aria-label="View Item Options"]')
        .click({ force: true })

      cy.get('a.options_tooltip_link[data-list-type="favourite"]')
        .should('be.visible')
        .contains(/Favorite|Kesukaan/i)
        .click({ force: true })

      cy.wait('@toggleFavorite').its('response.statusCode').should('eq', 200)
      assertSuccessToast()
    }

    cy.get('@fifthCard').find('h2 span').invoke('text').then((movieTitle) => {
      toggleFavoriteFromCard('@fifthCard')
      cy.wait(1000)
      toggleFavoriteFromCard('@fifthCard')
      cy.wait(2000)
      cy.screenshot('favorite-removed-toast')

      cy.get('@fifthCard')
        .find('.options a[aria-label="View Item Options"]')
        .click({ force: true })

      cy.get('a.options_tooltip_link.selected[data-list-type="favourite"]')
        .should('not.exist')

      openFavoritesPage()
      assertMovieNotInFavorites(movieTitle.trim())
      cy.wait(2000)
      cy.screenshot('favorite-removed-verified')
    })
  })

  // TC-FAV-006
  it('should persist favorite state after refresh', () => {
    login()
    openPopularMoviesLoggedIn()

    cy.get('.comp\\:poster-card').eq(5).as('sixthCard')

    const addFavoriteFromCard = (cardAlias) => {
      cy.intercept('PUT', '/u/*/remote/toggle-list-item').as('toggleFavorite')

      cy.get(cardAlias)
        .find('.options a[aria-label="View Item Options"]')
        .click({ force: true })

      cy.get('a.options_tooltip_link[data-list-type="favourite"]')
        .contains(/Favorite|Kesukaan/i)
        .click({ force: true })

      cy.wait('@toggleFavorite').its('response.statusCode').should('eq', 200)
      assertSuccessToast()
    }

    cy.get('@sixthCard').find('h2 span').invoke('text').then((movieTitle) => {
      addFavoriteFromCard('@sixthCard')

      cy.reload()
      cy.wait(2000)
      cy.screenshot('favorite-refresh-check')


      cy.get('.comp\\:poster-card').eq(5).as('sixthCard')

      cy.get('@sixthCard')
        .find('.options a[aria-label="View Item Options"]')
        .click({ force: true })

      cy.get('a.options_tooltip_link.selected[data-list-type="favourite"]')
        .should('exist')

      openFavoritesPage()
      assertMovieInFavorites(movieTitle.trim())
      cy.wait(2000)
      cy.screenshot('favorite-refresh-listed')
    })
  })
})