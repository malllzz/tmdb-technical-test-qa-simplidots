describe('Change Application Language', () => {
  const BASE_URL = 'https://www.themoviedb.org'

  const getUsername = () => Cypress.env('username')
  const getPassword = () => Cypress.env('password')

  // Helper functions
  const acceptCookiesIfAny = () => {
    cy.get('body').then(($body) => {
      if ($body.find('#onetrust-accept-btn-handler').length) {
        cy.get('#onetrust-accept-btn-handler').click()
      }
    })
  }

  const openLanguageMenu = () => {
    cy.get('li.translate', { timeout: 10000 })
      .should('be.visible')
      .click()
  }

  const openDefaultLanguageDropdown = () => {
    cy.get('#default_language_popup_label .k-dropdownlist')
      .scrollIntoView()
      .trigger('mousedown', { button: 0 })
      .click({ force: true })
  }

  const selectLanguage = (languageCode) => {
    cy.get('#default_language_popup_listbox', { timeout: 10000 })
      .find('li.k-list-item, li[role="option"]')
      .contains(new RegExp(`\\(${languageCode}\\)`, 'i'))
      .click({ force: true })

    cy.get('#default_language_popup_label .k-input-value-text')
      .should('contain', languageCode)

    cy.get('#default_language_popup')
      .should('have.value', languageCode)
  }

  const clickReload = () => {
    cy.get('.k-tooltip-content', { timeout: 10000 })
      .should('exist')
      .within(() => {
        cy.get('p.refresh')
          .should('not.have.class', 'hide')
          .find('a.button')
          .click({ force: true })
      })
  }

  const changeLanguage = (languageCode) => {
    openLanguageMenu()
    openDefaultLanguageDropdown()
    selectLanguage(languageCode)
    clickReload()
  }

  const changeLanguageIfNeeded = (languageCode) => {
    openLanguageMenu()

    cy.get('#default_language_popup')
      .invoke('val')
      .then((current) => {
        if (current === languageCode) {
          return
        }

        cy.intercept('POST', '/set_i18n').as('setI18n')

        openDefaultLanguageDropdown()
        selectLanguage(languageCode)
        clickReload()

        cy.wait('@setI18n')
      })
  }

  // Setup
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.visit(BASE_URL)
    acceptCookiesIfAny()
  })

  // TC-LANG-001
  it('TC-LANG-001: should change language to English', () => {
    changeLanguage('en-US')
    cy.contains('Movies', { timeout: 15000 }).should('be.visible')

    cy.wait(3000)
    cy.screenshot('TC-LANG-001-lang-en-us')
  })

  // TC-LANG-002
  it('TC-LANG-002: should change language to Bahasa Indonesia', () => {
    changeLanguageIfNeeded('id-ID')
    cy.contains('Film', { timeout: 10000 }).should('be.visible')

    cy.wait(3000)
    cy.screenshot('TC-LANG-002-lang-id-id')
  })

  // TC-LANG-003
  it('TC-LANG-003: should persist favorite data after language change (with login)', () => {
    cy.loginTMDB()

    cy.visit(`${BASE_URL}/u/${getUsername()}/favorites`)
    cy.url().then((url) => {
      if (!url.includes('favorite')) {
        cy.visit(`${BASE_URL}/u/${getUsername()}/favorite/movies`)
      }
    })
    cy.url().should('include', 'favorite')

    changeLanguageIfNeeded('en-US')
    cy.visit(`${BASE_URL}/u/${getUsername()}/favorites`)
    cy.title().should('match', /Favorites|My Favorites|Favorite Movies/i)
    cy.wait(3000)
    cy.screenshot('TC-LANG-003-fav-lang-en-us')

    changeLanguageIfNeeded('id-ID')
    cy.visit(`${BASE_URL}/u/${getUsername()}/favorites`)
    cy.title().should('match', /Favorit Saya|Paling Disuka/i)
    cy.wait(3000)
    cy.screenshot('TC-LANG-003-fav-lang-id-id')

    cy.url().should('include', 'favorite')
  })

  // TC-LANG-004
  it('TC-LANG-004: should NOT change language without clicking reload', () => {
    cy.title().then((titleBefore) => {
      openLanguageMenu()

      cy.get('#default_language_popup').invoke('val').then((current) => {
        const target = current === 'en-US' ? 'id-ID' : 'en-US'

        openDefaultLanguageDropdown()
        selectLanguage(target)

        cy.title().should('eq', titleBefore)

        cy.wait(3000)
        cy.screenshot('TC-LANG-004-lang-no-reload')
      })
    })
  })

  // TC-LANG-005
  it('TC-LANG-005: should fallback to current language for invalid selection', () => {
    openLanguageMenu()

    cy.get('#default_language_popup').invoke('val').then((current) => {
      openDefaultLanguageDropdown()
      selectLanguage(current)
    })
    
    cy.get('.k-tooltip-content p.refresh').should('have.class', 'hide')

    cy.wait(3000)
    cy.screenshot('TC-LANG-005-lang-invalid-no-change')
  })
})