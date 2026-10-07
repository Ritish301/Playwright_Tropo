import { Page, Locator, expect } from '@playwright/test';

/**
 * Encapsulates the multi-step "Create Project" wizard.
 * Method names map 1:1 to the BrowserStack TC-MC-E2E-02 step names so the
 * spec file reads as a checklist against that test case.
 */
export class ProjectWizardPage {
  readonly page: Page;

  readonly createProjectButton: Locator;
  readonly textbox: Locator;
  readonly selectDropdown: Locator;
  readonly mastercardOption: Locator;
  readonly mastercardLabel: Locator;
  readonly nextButtonExact: Locator;
  readonly nextButtonLoose: Locator;
  readonly fileInput: Locator;
  readonly profileUploadedText: Locator;
  readonly cardImageRadio: Locator;
  readonly cardImageXmlNode: Locator;
  readonly executeTransactionButton: Locator;
  readonly supportedApplicationsText: Locator;
  readonly icsSummaryText: Locator;
  readonly cvcOffsetText: Locator;
  readonly confirmIcsText: Locator;
  readonly okButton: Locator;
  readonly pleaseWaitHeading: Locator;
  readonly doneText: Locator;

  constructor(page: Page) {
    this.page = page;

    this.createProjectButton = page.getByRole('button', { name: 'plus   Create Project' });
    this.textbox = page.getByRole('textbox');
    this.selectDropdown = page.getByText('Select', { exact: true });
    this.mastercardOption = page.getByText('Mastercard');
    this.mastercardLabel = page.getByText('Mastercard', { exact: true });
    this.nextButtonExact = page.getByRole('button', { name: 'Next', exact: true });
    this.nextButtonLoose = page.getByRole('button', { name: 'Next' });
    this.fileInput = page.locator('input[type="file"]');
    this.profileUploadedText = page.getByText('The profile file has been uploaded successfully.');
    this.cardImageRadio = page.getByTitle('Explore the Card Images').getByRole('radio');
    this.cardImageXmlNode = page.locator('#root div').filter({ hasText: /^CP01_IMG\.xml$/ });
    this.executeTransactionButton = page.getByRole('button', { name: 'Execute Transaction' });
    this.supportedApplicationsText = page.getByText('Supported Applications');
    this.icsSummaryText = page.getByText('ICS Summary');
    this.cvcOffsetText = page.getByText('Enter CVC Offset 17Enter CVC Offset');
    this.confirmIcsText = page.getByText(
      'Could you please confirm that the details filled in the ICS are correct?CancelOk'
    );
    this.okButton = page.getByRole('button', { name: 'Ok' });
    this.pleaseWaitHeading = page.getByRole('heading', { name: 'Please wait...' });
    this.doneText = page.getByText('Done');
  }

  /** Step 1: Select Mastercard as the scheme */
  async selectSchemeMastercard(projectName: string): Promise<void> {
    await this.createProjectButton.click();
    await this.textbox.click();
    await this.textbox.fill(projectName);
    await this.selectDropdown.click();
    await this.mastercardOption.click();
    await expect(this.mastercardLabel).toBeVisible();
    await this.nextButtonExact.click();
  }

  /** Step 3: Import the .profile file into the project and validate */
  async importProfile(profilePath: string): Promise<void> {
    await this.fileInput.setInputFiles(profilePath);
    await expect(this.profileUploadedText).toBeVisible();
    await this.nextButtonExact.click();
  }

  /** Step 4: Select the card validation type as Virtual Card Image */
  async selectVirtualCardImageValidation(): Promise<void> {
    await this.cardImageRadio.click();
    await expect(this.cardImageRadio).toBeChecked();
    await this.nextButtonExact.click();
  }

  /** Step 5: Import the virtual card image */
  async importCardImage(cardImagePath: string): Promise<void> {
    await this.fileInput.setInputFiles(cardImagePath);
  }

  /** Step 6: Validate the imported virtual card image */
  async validateImportedCardImage(): Promise<void> {
    await expect(this.cardImageXmlNode).toBeVisible();
    await this.nextButtonExact.click();
  }

  /** Steps 7-9: Run pre-requisite test cases across CT/CTL/Magstripe */
  async runPrerequisiteTests(): Promise<void> {
    await this.executeTransactionButton.click();
    await this.nextButtonExact.click();
  }

  /** Step 10: Generate transaction logs from pre-requisite execution */
  async confirmTransactionLogsGenerated(): Promise<void> {
    await expect(this.supportedApplicationsText).toBeVisible();
    await this.nextButtonExact.click();
  }

  /** Step 11: Answer ICS questions - auto-fill + manual */
  async answerIcsQuestions(operatorName: string, cardName: string): Promise<void> {
    await this.textbox.first().click();
    await this.textbox.first().fill(operatorName);
    await this.textbox.nth(1).click();
    await this.textbox.nth(1).fill(cardName);
    await this.nextButtonLoose.click();

    await expect(this.icsSummaryText).toBeVisible();
    // Built here rather than in the constructor since it depends on the
    // operatorName/cardName passed in at call time.
    await expect(
      this.page.getByText(`Enter the Operator Name${operatorName}Enter the Card Name${cardName}`)
    ).toBeVisible();
    await expect(this.cvcOffsetText).toBeVisible();

    await this.nextButtonLoose.click();
  }

  /** Step 12: Finalise and complete project creation */
  async finaliseProjectCreation(): Promise<void> {
    await expect(this.confirmIcsText).toBeVisible();
    await this.okButton.click();

    await expect(this.pleaseWaitHeading).toBeVisible();
    await expect(this.doneText.first()).toBeVisible({ timeout: 120000 });
  }
}
