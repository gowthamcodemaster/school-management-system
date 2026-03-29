# apps/web/e2e/features/auth/login.feature
Feature: Super Admin Login
  As a super admin
  I want to securely log into the system
  So that I can manage the school management platform

  Background:
    Given I am on the login page

  # ── Happy path ─────────────────────────────────────────────────

  @smoke @acceptance
  Scenario: Successful login with valid credentials and MFA
    When I enter valid admin email and password
    And I click the login button
    Then I should be prompted for MFA verification
    When I enter a valid MFA code
    Then I should be redirected to the admin dashboard
    And I should see a welcome message

  @smoke @acceptance
  Scenario: Successful login persists session
    When I enter valid admin email and password
    And I click the login button
    And I enter a valid MFA code
    Then I should be redirected to the admin dashboard
    When I refresh the page
    Then I should still be on the admin dashboard

  # ── Sad path ───────────────────────────────────────────────────

  @acceptance
  Scenario: Login fails with incorrect password
    When I enter valid admin email and an incorrect password
    And I click the login button
    Then I should see an invalid credentials error
    And I should remain on the login page

  @acceptance
  Scenario: Login fails with non-existent email
    When I enter a non-existent email and any password
    And I click the login button
    Then I should see an invalid credentials error

  @acceptance
  Scenario: Account locks after multiple failed attempts
    When I enter valid admin email and an incorrect password
    And I click the login button
    And I enter valid admin email and an incorrect password
    And I click the login button
    And I enter valid admin email and an incorrect password
    And I click the login button
    And I enter valid admin email and an incorrect password
    And I click the login button
    And I enter valid admin email and an incorrect password
    And I click the login button
    Then I should see an account locked message
    And the login button should be disabled

  @acceptance
  Scenario: Invalid MFA code is rejected
    When I enter valid admin email and password
    And I click the login button
    Then I should be prompted for MFA verification
    When I enter an invalid MFA code
    Then I should see an invalid MFA error
    And I should remain on the MFA verification page

  # ── Security ───────────────────────────────────────────────────

  @security @acceptance
  Scenario: Login page redirects authenticated users
    Given I am already logged in as super admin
    When I navigate to the login page
    Then I should be redirected to the admin dashboard

  @security @acceptance
  Scenario: Protected routes redirect unauthenticated users
    Given I am not logged in
    When I navigate to the admin dashboard directly
    Then I should be redirected to the login page

  @security @acceptance
  Scenario: Session expires after inactivity
    Given I am logged in as super admin
    When my session token expires
    Then I should be redirected to the login page
    And I should see a session expired message
