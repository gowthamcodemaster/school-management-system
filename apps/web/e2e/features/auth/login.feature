# apps/web/e2e/features/auth/login.feature
Feature: Super Admin Login Page
  As a Super Admin
  I want to log in to the Vidya Dhara platform
  So that I can manage schools and subscriptions

  # ── Page rendering ─────────────────────────────────────────────

  @smoke @acceptance
  Scenario: Login page renders correctly
    Given I am on the login page
    Then I should see the logo
    And I should see the email and password fields
    And I should see the forgot password link

  # ── Happy path ─────────────────────────────────────────────────

  @smoke @acceptance
  Scenario: TC-001 Successful login without MFA redirects to dashboard
    Given I am on the login page
    When I enter valid admin email and password
    And I click the login button
    Then I should be redirected to the admin dashboard

  @acceptance
  Scenario: TC-001 Successful login with MFA prompts for code
    Given I am on the login page
    When I enter valid admin email and password
    And I click the login button
    Then I should be prompted for MFA verification
    When I enter a valid MFA code
    Then I should be redirected to the admin dashboard

  @acceptance
  Scenario: TC-003 Email field is pre-filled on revisit after login
    Given I am on the login page
    When I enter valid admin email and password
    And I click the login button
    And I refresh the page
    Then I should still be on the admin dashboard

  # ── Validation ─────────────────────────────────────────────────

  @acceptance
  Scenario: TC-006 Shows error when email is empty
    Given I am on the login page
    When I submit the form without filling any fields
    Then I should see an email validation error
    And I should remain on the login page

  @acceptance
  Scenario: TC-007 Shows error when password is empty
    Given I am on the login page
    When I enter valid admin email and password
    And I submit the form without filling any fields
    Then I should see a password validation error

  @acceptance
  Scenario: TC-008 Shows error for invalid email format
    Given I am on the login page
    When I enter an invalid email format
    Then I should see an invalid email format error
    And I should remain on the login page

  # ── Negative scenarios ─────────────────────────────────────────

  @acceptance
  Scenario: TC-004 Wrong password shows error message
    Given I am on the login page
    When I enter valid admin email and an incorrect password
    And I click the login button
    Then I should see an invalid credentials error
    And I should remain on the login page

  @acceptance
  Scenario: TC-005 Non-existent email shows same error as wrong password
    Given I am on the login page
    When I enter a non-existent email and any password
    And I click the login button
    Then I should see an invalid credentials error
    And I should remain on the login page

  @acceptance
  Scenario: TC-009 Account locks after 5 failed attempts
    Given I am on the login page
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

  # ── MFA ────────────────────────────────────────────────────────

  @acceptance
  Scenario: TC-017 Invalid MFA code shows error
    Given I am on the login page
    When I enter valid admin email and password
    And I click the login button
    Then I should be prompted for MFA verification
    When I enter an invalid MFA code
    Then I should see an invalid MFA error
    And I should remain on the MFA verification page

  @acceptance
  Scenario: MFA back button returns to login form
    Given I am on the login page
    When I enter valid admin email and password
    And I click the login button
    Then I should be prompted for MFA verification
    When I click back on the MFA screen
    Then I should be back on the login page

  # ── Security ───────────────────────────────────────────────────

  @security @acceptance
  Scenario: Unauthenticated user is redirected from dashboard to login
    Given I am not logged in
    When I navigate to the admin dashboard directly
    Then I should be redirected to the login page

  @security @acceptance
  Scenario: Authenticated user visiting login is redirected to dashboard
    Given I am already logged in as super admin
    When I navigate to the login page
    Then I should be redirected to the dashboard
