Feature: Sorting Favorite Movies

  Scenario: Sort favorite movies by popularity
    Given user is logged in
    And user has multiple favorite movies
    When user selects sort by popularity
    Then favorite list should be sorted by popularity

  Scenario: Sort favorite movies by release date
    Given user is logged in
    And user has multiple favorite movies
    When user selects sort by release date
    Then favorite list should be sorted by release date

  Scenario: Sort favorite movies by date added
    Given user is logged in
    And user has multiple favorite movies
    When user selects sort by date adddes
    Then favorite list should be sorted by date added

  Scenario: Sorting resets to default after logout and login
    Given user is logged in
    And user selects a non-default sorting preference
    When user logs out and logs in again
    And user navigates to the favorite page
    Then sorting preference should reset to default

  Scenario: User selects invalid sorting option
    Given user is on favorite page
    When user navigates with an invalid sorting parameter
    Then system should display an invalid request error message
