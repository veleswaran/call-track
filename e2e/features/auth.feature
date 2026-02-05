@smoke @auth
Feature: Authentication

  As an administrator
  I want to login to the CallTrack AI dashboard
  So that I can monitor call activity

  Background:
    Given I am on the login page

  Scenario: Successful login with valid credentials
    When I login with valid credentials
    Then I should be on the home page
    And I should see the dashboard metrics

  Scenario: Unsuccessful login with invalid credentials
    When I login with email "wrong@example.com" and password "wrongpass"
    Then I should see an error message "Invalid credentials"
