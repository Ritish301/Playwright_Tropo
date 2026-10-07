import { Page, Locator, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export interface DownloadedReports {
  testReportPath: string;
  htmlReportPath: string;
  detailedPdfPath: string;
  summaryPdfPath: string;
}

const EXPORT_OPTIONS = [
  'Test Report',
  'Detailed Report in HTML',
  'Detailed Report in Pdf',
  'Summary Report in Pdf',
] as const;

export class ReportsPage {
  readonly page: Page;

  // These two depend on a runtime value (the row pattern / export label),
  // so they're locator FACTORIES rather than fixed Locators -- still built
  // once in the constructor, just parameterized.
  readonly reportRow: (namePattern: RegExp) => Locator;
  readonly downloadButtonFor: (label: string) => Locator;

  constructor(page: Page) {
    this.page = page;

    this.reportRow = (namePattern: RegExp) =>
      page.getByRole('row', { name: namePattern }).getByRole('button');

    this.downloadButtonFor = (label: string) =>
      page.getByText(label).locator('..').getByRole('button', { name: 'download' });
  }

  /** Opens the row for a given test case (e.g. /CP01/) to reveal export actions */
  async openReportRow(rowNamePattern: RegExp): Promise<void> {
    await this.reportRow(rowNamePattern).click();
  }

  /**
   * Step 14: Produce the test report and export PDF, HTML, ZIP.
   * Downloads all four report formats, saving each into reportsDir
   * (created if it doesn't already exist), and returns their saved paths.
   */
  async exportAllReports(reportsDir: string): Promise<DownloadedReports> {
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const downloadedFiles: Record<string, string> = {};

    for (const label of EXPORT_OPTIONS) {
      const downloadPromise = this.page.waitForEvent('download');

      await this.downloadButtonFor(label).click();

      const download = await downloadPromise;
      const savePath = path.join(reportsDir, download.suggestedFilename());
      await download.saveAs(savePath);

      expect(fs.existsSync(savePath)).toBeTruthy();

      downloadedFiles[label] = savePath;
      console.log(`${label}: ${savePath}`);
    }

    return {
      testReportPath: downloadedFiles['Test Report'],
      htmlReportPath: downloadedFiles['Detailed Report in HTML'],
      detailedPdfPath: downloadedFiles['Detailed Report in Pdf'],
      summaryPdfPath: downloadedFiles['Summary Report in Pdf'],
    };
  }
}
