Feature: Change Application Language

  Scenario: User changes language from Bahasa Indonesia to English
    Given user is on homepage
    When user clicks language menu on navbar
    And user selects "English (en-US)"
    And user clicks "Reload Page" button
    Then the UI should display in English

  Scenario: User changes language from English to Bahasa Indonesia
    Given user is on homepage
    When user clicks language menu on navbar
    And user selects "Indonesian (id-ID)"
    And user clicks "Reload Page" button
    Then the UI should display in Bahasa Indonesia

  Scenario: Favorite data persists after language change
    Given user is logged in
    And user has added movies to favorite
    When user clicks language menu on navbar
    And user selects "Indonesian (id-ID)"
    And user clicks "Reload Page" button
    Then favorite movies should still be available

  Scenario: Favorite data persists after language change
    Given user is logged in
    And user has at least one movie or TV show in favorites
    When user opens profile menu
    And user navigates to Overview section
    And user clicks Favorites menu
    And user selects Movies or TV Shows tab
    And user opens language menu on navbar
    And user selects "Bahasa Indonesia"
    Then system should update language to Indonesian
    And user should still be on Favorites page
    And favorite movies or TV shows should still be visible


  Scenario: Language change requires reload
    Given user is on homepage
    When user clicks language menu on navbar
    When user selects a language without clicking reload
    Then the UI should not change

  Scenario: Invalid language selection
    Given user is on homepage
    When user clicks language menu on navbar
    When user selects unsupported language
    Then system should fallback to current language