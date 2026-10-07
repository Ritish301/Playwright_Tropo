import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object for the 8-step "Create Project" wizard.
 * Selectors below are based on the accessibility tree captured during the
 * manual TC-32671 run (2026-09-18) against http://localhost:3002.
 *
 * NOTE: Some fields (Operator Name / Card Name on the ICS Questions step)
 * have no unique accessible name in the DOM, so they are targeted by
 * position within their section container. If the app adds stable
 * data-testid attributes later, prefer swapping these to
 * page.getByTestId(...) for robustness.
 */
export class CreateProjectPage {
  readonly page: Page;

  // Common wizard controls
  readonly nextButton: Locator;
  readonly backButton: Locator;
  readonly closeButton: Locator;

  // Step 1: Project Information
  readonly projectNameInput: Locator;
  readonly schemeDropdownTrigger: Locator;

  // Step 2: Select Profile
  readonly chooseProfileFileButton: Locator;
  readonly profileUploadedMessage: Locator;

  // Step 3: Select Card Type
  readonly explorePhysicalCardRadio: Locator;
  readonly exploreCardImagesRadio: Locator;

  // Step 4: Input Card Image
  readonly chooseCardImageFileButton: Locator;
  readonly cardImageTable: Locator;

  // Step 5: Explore Card Image / Execute Transaction
  readonly executeTransactionButton: Locator;

  // Step 6: Applications List
  readonly supportedApplicationsTable: Locator;

  // Step 7: ICS Questions
  readonly operatorNameInput: Locator;
  readonly cardNameInput: Locator;
  readonly cvcOffset1Input: Locator;
  readonly cvcOffset2Input: Locator;

  // Step 8: Confirm Details (ICS Summary)
  readonly icsSummaryHeading: Locator;
  readonly icsProjectNameValue: Locator;
  readonly icsSchemeValue: Locator;
  readonly icsOperatorNameValue: Locator;
  readonly icsCardNameValue: Locator;

  // Finalize confirmation dialog
  readonly confirmDialog: Locator;
  readonly confirmOkButton: Locator;
  readonly confirmCancelButton: Locator;
  readonly pleaseWaitDialog: Locator;

  constructor(page: Page) {
    this.page = page;

    this.nextButton = page.getByRole('button', { name: 'Next', exact: true });
    this.backButton = page.getByRole('button', { name: 'Back' });
    this.closeButton = page.getByRole('button', { name: 'Close' });

    // Step 1
    this.projectNameInput = page.getByRole('textbox').first();
    this.schemeDropdownTrigger = page.locator('div').filter({ hasText: /^Select$/ }).first();

    // Step 2
    this.chooseProfileFileButton = page.getByRole('button', { name: 'Choose File' });
    this.profileUploadedMessage = page.getByText('The profile file has been uploaded successfully.');

    // Step 3
    this.explorePhysicalCardRadio = page.getByTitle('Explore Physical Card');
    this.exploreCardImagesRadio = page.getByTitle('Explore the Card Images');

    // Step 4 (re-uses "Choose File" role name; wizard order guarantees this
    // is the card-image dropzone by the time it's called)
    this.chooseCardImageFileButton = page.getByRole('button', { name: 'Choose File' });
    this.cardImageTable = page.locator('table').filter({ hasText: 'File Name' });

    // Step 5
    this.executeTransactionButton = page.getByRole('button', { name: 'Execute Transaction' });

    // Step 6
    this.supportedApplicationsTable = page.locator('table').filter({ hasText: 'AID' });

    // Step 7
    this.operatorNameInput = page.getByRole('textbox').nth(0);
    this.cardNameInput = page.getByRole('textbox').nth(1);
    this.cvcOffset1Input = page.getByRole('spinbutton').nth(0);
    this.cvcOffset2Input = page.getByRole('spinbutton').nth(1);

    // Step 8
    this.icsSummaryHeading = page.getByText('ICS Summary');
    this.icsProjectNameValue = page.locator('text=Project Name').locator('xpath=following-sibling::*[1]');
    this.icsSchemeValue = page.locator('text=Scheme Name').locator('xpath=following-sibling::*[1]');
    this.icsOperatorNameValue = page
      .locator('text=Enter the Operator Name')
      .locator('xpath=following-sibling::*[1]');
    this.icsCardNameValue = page.locator('text=Enter the Card Name').locator('xpath=following-sibling::*[1]');

    // Finalize
    this.confirmDialog = page.getByRole('dialog').filter({
      hasText: 'Could you please confirm that the details filled in the ICS are correct?',
    });
    this.confirmOkButton = this.confirmDialog.getByRole('button', { name: 'Ok' });
    this.confirmCancelButton = this.confirmDialog.getByRole('button', { name: 'Cancel' });
    this.pleaseWaitDialog = page.getByRole('heading', { name: 'Please wait...' });
  }

  async goto(baseUrl: string) {
    await this.page.goto(`${baseUrl}/project/create`);
  }

  // ---------------- Step 1: Project Information ----------------
  async enterProjectInformation(projectName: string, scheme: 'Visa' | 'Mastercard') {
    await this.projectNameInput.fill(projectName);
    await this.schemeDropdownTrigger.click();
    await this.page.getByText(scheme, { exact: true }).click();
    await expect(this.nextButton).toBeEnabled();
  }

  // ---------------- Step 2: Select Profile ----------------
  async uploadProfile(filePath: string) {
    const [fileChooser] = await Promise.all([
      this.page.waitForEvent('filechooser'),
      this.chooseProfileFileButton.click(),
    ]);
    await fileChooser.setFiles(filePath);
    await expect(this.profileUploadedMessage).toBeVisible({ timeout: 15_000 });
    await expect(this.nextButton).toBeEnabled();
  }

  // ---------------- Step 3: Select Card Type ----------------
  async selectCardType(type: 'Explore Physical Card' | 'Explore the Card Images') {
    const radio =
      type === 'Explore Physical Card' ? this.explorePhysicalCardRadio : this.exploreCardImagesRadio;
    await radio.click();
    await expect(this.nextButton).toBeEnabled();
  }

  // ---------------- Step 4: Input Card Image ----------------
  async uploadCardImage(filePath: string, fileName: string) {
    const [fileChooser] = await Promise.all([
      this.page.waitForEvent('filechooser'),
      this.chooseCardImageFileButton.click(),
    ]);
    await fileChooser.setFiles(filePath);
    await expect(this.cardImageTable.getByText(fileName)).toBeVisible({ timeout: 15_000 });
    await expect(this.nextButton).toBeEnabled();
  }

  // ---------------- Step 5: Explore Card Image ----------------
  async executeTransactionAndWaitForCounts() {
    await this.executeTransactionButton.click();
    // All three rows (MAGSTRIPE / CONTACT / CONTACTLESS) should move off
    // count 0. Polling the MAGSTRIPE row's count cell is representative.
    await expect(
      this.page.locator('text=CONTACT_MAGSTRIPE_TXN').locator('..').locator('..').getByText('1', { exact: true })
    ).toBeVisible({ timeout: 20_000 });
    await expect(this.nextButton).toBeEnabled();
  }
 // ---------------- Step 6: Applications List ----------------
async assertApplicationsListSupported(aid: string) {
  // Target the AID cell specifically (rendered as <strong>), not the whole table's text
  await expect(
    this.supportedApplicationsTable.getByRole('cell').filter({ hasText: aid }).first()
  ).toBeVisible({ timeout: 30_000 });

  await expect(this.supportedApplicationsTable.getByText('Supported').first()).toBeVisible({ timeout: 30_000 });
  await expect(this.nextButton).toBeEnabled();
}

  // ---------------- Step 7: ICS Questions ----------------
  async fillIcsQuestions(operatorName: string, cardName: string) {
    await this.operatorNameInput.fill(operatorName);
    await this.cardNameInput.fill(cardName);
    await expect(this.nextButton).toBeEnabled();
  }

  // ---------------- Step 8: Confirm Details ----------------
  async assertIcsSummary(opts: {
    projectName: string;
    scheme: string;
    operatorName: string;
    cardName: string;
  }) {
    await expect(this.icsSummaryHeading).toBeVisible();
    await expect(this.icsProjectNameValue).toHaveText(opts.projectName);
    await expect(this.icsSchemeValue).toHaveText(opts.scheme);
    await expect(this.icsOperatorNameValue).toHaveText(opts.operatorName);
    await expect(this.icsCardNameValue).toHaveText(opts.cardName);
  }

  // ---------------- Step 9: Finalize (Next -> Ok) ----------------
  async finalizeProject() {
    await this.nextButton.click();
    await expect(this.confirmDialog).toBeVisible();
    await this.confirmOkButton.click();
    // "Please wait..." spinner appears while the backend finalizes the
    // project; the app then auto-navigates to /project on completion.
   await this.page.waitForURL('http://localhost:3002/project', { timeout:300000 });
  }

  async clickNext() {
    await this.nextButton.click();
  }
}
