# apps/api/e2e/features/auth/credential-login.feature
Feature: Super Admin Credential-based Login API
  As the Vidya Dhara platform
  I want to authenticate Super Admins via credentials
  So that only authorized users can access the system

  Background:
    Given the database is clean and seeded with a super admin

  # ── Happy Path ─────────────────────────────────────────────────

  @smoke @acceptance
  Scenario: TC-001 Successful login returns tokens
    When I POST to "/auth/login" with valid admin credentials
    Then the response status should be 200
    And the response should contain an access token
    And the response should contain a refresh token cookie
    And the access token should be a valid JWT
    And the response should contain user details without password

  @acceptance
  Scenario: TC-002 Login button disabled during submission - API does not double issue tokens
    When I POST to "/auth/login" with valid admin credentials twice simultaneously
    Then both responses should return 200
    And each response should contain a unique access token

  @acceptance
  Scenario: Successful login resets failed attempt counter
    Given the super admin has 3 failed login attempts recorded
    When I POST to "/auth/login" with valid admin credentials
    Then the response status should be 200
    And the super admin failed login attempts should be reset to 0

  # ── Negative Scenarios ─────────────────────────────────────────

  @acceptance
  Scenario: TC-004 Wrong password returns 401
    When I POST to "/auth/login" with an incorrect password
    Then the response status should be 401
    And the response should contain an error message
    And the failed login attempts should be incremented

  @acceptance
  Scenario: TC-005 Non-existent email returns same 401 as wrong password
    When I POST to "/auth/login" with a non-existent email
    Then the response status should be 401
    And the error message should be identical to a wrong password error

  @acceptance
  Scenario: TC-006 Missing email returns 400
    When I POST to "/auth/login" with missing email field
    Then the response status should be 400

  @acceptance
  Scenario: TC-007 Missing password returns 400
    When I POST to "/auth/login" with missing password field
    Then the response status should be 400

  @acceptance
  Scenario: TC-008 Invalid email format returns 400
    When I POST to "/auth/login" with an invalid email format
    Then the response status should be 400

  @acceptance
  Scenario: TC-009 Account locks after 5 failed attempts
    When I POST to "/auth/login" with an incorrect password 5 times
    Then the response status should be 429
    And the response should contain an account locked message
    And further login attempts should return 429

  @acceptance
  Scenario: TC-010 SQL injection attempt is rejected safely
    When I POST to "/auth/login" with SQL injection as email
    Then the response status should be 400
    And no database error should be exposed in the response

  @acceptance
  Scenario: TC-011 XSS attempt is sanitized
    When I POST to "/auth/login" with XSS payload as email
    Then the response status should be 400
    And the response should not reflect the script back

  # ── Token Refresh ──────────────────────────────────────────────

  @smoke @acceptance
  Scenario: Valid refresh token returns new access token
    Given I am logged in as super admin via API
    When I POST to "/auth/refresh" with my refresh token
    Then the response status should be 200
    And the response should contain a new access token
    And the old refresh token should be revoked

  @acceptance
  Scenario: Invalid refresh token returns 401
    When I POST to "/auth/refresh" with an invalid refresh token
    Then the response status should be 401

  @acceptance
  Scenario: Expired refresh token returns 401
    When I POST to "/auth/refresh" with an expired refresh token
    Then the response status should be 401

  @acceptance
  Scenario: Revoked refresh token returns 401
    Given I am logged in as super admin via API
    When I POST to "/auth/logout"
    And I POST to "/auth/refresh" with my refresh token
    Then the response status should be 401

  # ── Logout ─────────────────────────────────────────────────────

  @smoke @acceptance
  Scenario: Logout revokes all tokens
    Given I am logged in as super admin via API
    When I POST to "/auth/logout"
    Then the response status should be 200
    And my access token should no longer work on protected routes

  # ── Protected Routes ───────────────────────────────────────────

  @smoke @acceptance
  Scenario: Protected route accessible with valid token
    Given I am logged in as super admin via API
    When I GET "/admin/profile" with my access token
    Then the response status should be 200

  @acceptance
  Scenario: Protected route blocked without token
    When I GET "/admin/profile" without a token
    Then the response status should be 401

  @acceptance
  Scenario: Protected route blocked with expired token
    When I GET "/admin/profile" with an expired token
    Then the response status should be 401

  # ── Health Check ───────────────────────────────────────────────

  @smoke @acceptance
  Scenario: Health check returns OK
    When I GET "/"
    Then the response status should be 200
