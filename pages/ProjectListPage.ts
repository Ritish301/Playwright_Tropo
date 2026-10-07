import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object for the Project List (/project) screen.
 * Used at the end of TC-32671 to confirm the newly created project settles
 * into "Done" status within the expected 30-90 second window, and that
 * Export Report becomes enabled.
 */
export class ProjectListPage {
  readonly page: Page;
  readonly projectListHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.projectListHeading = page.getByText(/^Project List/);
  }

  async goto(baseUrl: string) {
    await this.page.goto(`${baseUrl}/project`);
  }

  /** Returns the row (as a Locator) for the given project name. */
  row(projectName: string): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByText(projectName, { exact: true }) });
  }

  statusCell(projectName: string): Locator {
    // Status is the 3rd column: Project Name | Scheme | Status | Created On | Actions
    return this.row(projectName).locator('td, [role="cell"]').nth(2);
  }

  exportReportButton(projectName: string): Locator {
    return this.row(projectName).getByRole('button', { name: 'Export Report' });
  }

  /**
   * Polls the Status column for the given project until it reads "Done",
   * matching the test case's expected ~30-90 second settling window.
   */
  async waitForDoneStatus(projectName: string, timeoutMs = 120_000) {
    await expect(this.statusCell(projectName)).toHaveText('Done', { timeout: timeoutMs });
  }

  async assertExportReportEnabled(projectName: string) {
    await expect(this.exportReportButton(projectName)).toBeEnabled();
  }

  async assertProjectVisible(projectName: string, scheme: string) {
    const row = this.row(projectName);
    await expect(row).toBeVisible();
    await expect(row.getByText(scheme)).toBeVisible();
  }
}
