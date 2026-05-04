Feature: View Favorite Movie List

  Scenario: User accesses favorite movie page
    Given user is logged in
    When user navigates to favorite movie page
    Then system should display list of favorite movies

  Scenario: Favorite movie information is consistent
    Given user is logged in
    When user views favorite movie list
    Then movie information should match listing page

  Scenario: Favorite list shows latest added movie first
    Given user is logged in
    And user adds multiple movies to favorite
    When user views favorite list
    Then latest added movie should appear at the top

  Scenario: User views empty favorite list
    Given user is logged in
    And user has no favorite movies
    When user opens favorite page
    Then system should display empty state message

  Scenario: User tries to access favorite list without login
    Given user is not logged in
    When user accesses favorite page
    Then system should redirect user to login page