/// <reference types="cypress" />

// This test assumes you have two test users and can log in as both
// Adjust selectors and URLs as needed for your app

describe('ATR Ranking Update on Ranked Match Completion', () => {
  const userA = { email: 'testuserA@example.com', password: 'passwordA' };
  const userB = { email: 'testuserB@example.com', password: 'passwordB' };

  let userAInitialPoints = null;
  let userBInitialPoints = null;

  function login(email, password) {
    cy.visit('/auth');
    cy.get('input[name=email]').type(email);
    cy.get('input[name=password]').type(password);
    cy.get('button[type=submit]').click();
    cy.url().should('not.include', '/auth');
  }

  function getDashboardPoints() {
    // Adjust selector to match the dashboard ATR points display
    return cy.get('[data-cy=dashboard-atr-points]').invoke('text').then(Number);
  }

  it('Gets initial ATR points for both users', () => {
    login(userA.email, userA.password);
    cy.visit('/dashboard');
    getDashboardPoints().then(points => {
      userAInitialPoints = points;
    });
    cy.get('[data-cy=logout]').click();

    login(userB.email, userB.password);
    cy.visit('/dashboard');
    getDashboardPoints().then(points => {
      userBInitialPoints = points;
    });
    cy.get('[data-cy=logout]').click();
  });

  it('User A schedules and completes a ranked singles match with User B', () => {
    login(userA.email, userA.password);
    cy.visit('/schedule/new');
    // Fill out match scheduling form
    cy.get('select[name=opponent]').select(userB.email);
    cy.get('select[name=event_type]').select('match_singles_ranked');
    cy.get('button[type=submit]').click();
    cy.contains('Match scheduled').should('exist');
    cy.get('[data-cy=logout]').click();

    // User B accepts invitation
    login(userB.email, userB.password);
    cy.visit('/dashboard');
    cy.contains('Requests').click();
    cy.contains('Accept').click();
    cy.get('[data-cy=logout]').click();

    // User A completes the match and submits a win
    login(userA.email, userA.password);
    cy.visit('/dashboard');
    cy.contains('Complete Match').click();
    cy.get('input[name=scoreA]').type('6');
    cy.get('input[name=scoreB]').type('4');
    cy.get('button[type=submit]').click();
    cy.contains('Match completed').should('exist');
    cy.get('[data-cy=logout]').click();
  });

  it('ATR points are updated for both users', () => {
    login(userA.email, userA.password);
    cy.visit('/dashboard');
    getDashboardPoints().should('not.eq', userAInitialPoints);
    cy.get('[data-cy=logout]').click();

    login(userB.email, userB.password);
    cy.visit('/dashboard');
    getDashboardPoints().should('not.eq', userBInitialPoints);
    cy.get('[data-cy=logout]').click();
  });
});
