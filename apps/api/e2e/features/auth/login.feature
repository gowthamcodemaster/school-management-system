# apps/api/e2e/features/auth/login.feature
Feature: Super Admin Authentication API
  As the system
  I want to securely authenticate super admins via the API
  So that only authorized users can access protected resources

  # ── Login ──────────────────────────────────────────────────────

  @smoke @acceptance
  Scenario: Successful login returns tokens
    When I POST to "/auth/login" with valid admin credentials
    Then the response status should be 200
    And the response should contain an access token
    And the response should contain a refresh token
    And the access token should be a valid JWT

  @acceptance
  Scenario: Login fails with wrong password
    When I POST to "/auth/login" with an incorrect password
    Then the response status should be 401
    And the response should contain an error message

  @acceptance
  Scenario: Login fails with non-existent email
    When I POST to "/auth/login" with a non-existent email
    Then the response status should be 401

  @acceptance
  Scenario: Login fails with missing fields
    When I POST to "/auth/login" with missing credentials
    Then the response status should be 400

  @acceptance
  Scenario: Account locks after 5 failed attempts
    When I POST to "/auth/login" with an incorrect password 5 times
    Then the response status should be 429
    And the response should contain an account locked message

  # ── Token refresh ──────────────────────────────────────────────

  @smoke @acceptance
  Scenario: Valid refresh token returns new access token
    Given I am logged in as super admin via API
    When I POST to "/auth/refresh" with my refresh token
    Then the response status should be 200
    And the response should contain a new access token

  @acceptance
  Scenario: Invalid refresh token is rejected
    When I POST to "/auth/refresh" with an invalid refresh token
    Then the response status should be 401

  @acceptance
  Scenario: Expired refresh token is rejected
    When I POST to "/auth/refresh" with an expired refresh token
    Then the response status should be 401

  # ── Logout ─────────────────────────────────────────────────────

  @smoke @acceptance
  Scenario: Logout invalidates tokens
    Given I am logged in as super admin via API
    When I POST to "/auth/logout"
    Then the response status should be 200
    And my access token should no longer work

  # ── Protected routes ───────────────────────────────────────────

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

  # ── Health check ───────────────────────────────────────────────

  @smoke @acceptance
  Scenario: Health check returns OK
    When I GET "/"
    Then the response status should be 200
