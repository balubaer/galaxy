import { getGreeting } from '../support/app.po';

describe('worlds', () => {
  beforeEach(() => cy.visit('/'));

  it('should display welcome message', () => {
    getGreeting().contains('Welcome to worlds!');
  });
});
