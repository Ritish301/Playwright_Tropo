import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly projectsLink: Locator;

  private readonly url = 'http://localhost:3002/dashboard';

  constructor(page: Page) {
    this.page = page;
    this.projectsLink = page.getByRole('link', { name: 'Projects', exact: true });
  }

  async goto() {
    await this.page.goto(this.url);
  }

  async goToProjects() {
    await this.projectsLink.click();
  }
}
