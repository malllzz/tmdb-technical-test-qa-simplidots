Feature: Remove Movie from Favorite

  Scenario: Remove movie via Favorites list page
    Given user is logged in
    And user has at least one movie in the favorites list
    When user clicks the remove icon on a movie card in the favorites list
    Then the movie should be immediately removed from the list

  Scenario: Remove movie via Movie List page
    Given user is logged in
    And user has marked a movie as favorite
    When user clicks the unfavorite icon on the movie card from the general movie list
    Then the movie should be removed from the favorites

  Scenario: Remove movie via Detail movie page
    Given user is logged in
    And user has marked a movie as favorite
    When user clicks the unfavorite button on the movie detail page
    Then the movie should be removed from the favorites

  Scenario: Favorite status synchronization across pages
    Given user is logged in
    And user removes a movie from favorites
    When user navigates to the movie list or detail page of that movie
    Then the movie's favorite status should reflect as unfavorited

  Scenario: Remove the last movie from the favorites list
    Given user is logged in
    And user has exactly one movie in the favorites list
    When user removes that movie from the favorites list
    Then the favorites list should display an empty state