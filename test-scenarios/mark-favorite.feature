Feature: Mark Movie as Favorite

  Scenario: Add movie to favorite from movie listing page
    Given user is logged in
    And user navigates to popular movies list
    When user clicks the 3-dots menu on a movie card
    And user clicks the favorite option
    Then a success message should appear
    And favorite indicator on the movie card should be active
    And the movie should be added to favorite list

  Scenario: Add movie to favorite from movie detail page
    Given user is logged in
    And user navigates to popular movies list
    When user opens a movie detail page
    And user clicks favorite button
    Then a success message should appear
    And favorite indicator on the detail page should be active
    And the movie should be added to favorite list

  Scenario: User tries to add favorite without login
    Given user is not logged in
    And user navigates to popular movies list
    When user opens movie detail page
    And user clicks favorite button
    Then system should prompt user to login

  Scenario: Add multiple movies sequentially to favorite list
    Given user is logged in
    And user navigates to popular movies list
    When user adds a movie to favorite
    And user adds another different movie to favorite
    Then both movies should appear in the favorite list

  Scenario: System prevents duplicate by removing the movie when favorite is clicked again
    Given user is logged in
    And user has already added a movie to the favorite list
    When user clicks the favorite icon again on the same movie
    Then a success message should appear
    And the movie should be removed from the favorite list
    And the system should not display duplicate movies in the favorite list

  Scenario: Favorite state persists after refresh
    Given user is logged in
    And user has added a movie to favorite
    When user refreshes the page
    Then the movie should still be marked as favorite
