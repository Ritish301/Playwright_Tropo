import { test, expect } from '@playwright/test';
import fs from 'fs';
import { DashboardPage } from '../pages/DashboardPage';
import { ProjectWizardPage } from '../pages/ProjectWizardPage';
import { ReportsPage } from '../pages/ReportsPage';
import { ProjectListPage } from '../pages/ProjectListPage';
import { loadTestData } from '../pages/testData';
import { compareResultXmlFiles } from '../pages/xmlCompare';

const TEST_DATA_PATH = 'Test data/Tropo_Testdata.json';
const REPORTS_DIR = 'D:\\Ritish\\Ritish\\Automation\\Reports';
const EXPECTED_RESULT_FILE =
  'D:\\Ritish\\Ritish\\Automation\\Playwright_Tropo\\Reports\\Expected\\20260810124137-RESULTS-CP01_IMG.xml';

// Mirrors BrowserStack Test Management TC-MC-E2E-02
// "Mastercard E2E happy path - virtual card image"
// Each test.step() name below corresponds 1:1 to a step row in that test case,
// so a human comparing the two side by side can match them without guessing.

test('TC-MC-E2E-02: Mastercard E2E happy path - virtual card image', async ({ page }) => {
  const dashboardPage = new DashboardPage(page);
  const projectWizard = new ProjectWizardPage(page);
  const reportsPage = new ReportsPage(page);
  const projectListPage = new ProjectListPage(page);

  const testData = loadTestData(TEST_DATA_PATH);

  await dashboardPage.goto();
  await dashboardPage.goToProjects();

  for (const { Project_Name, Profile, Cardimage } of testData) {
    await test.step('Step 1: Select Mastercard as the scheme', async () => {
      await projectWizard.selectSchemeMastercard(Project_Name);
    });

    /*
    await test.step('Step 2: Create a new project', async () => {
      // Expected: Project created; empty project ready for inputs.
      // INFERRED assertion - no dedicated "project created" indicator exists in the original script.
      // TODO: confirm the real success signal (project ID shown, toast, wizard state) and swap this in.
      await expect(page.getByText(Project_Name)).toBeVisible();
    });
    */

    await test.step('Step 3: Import the .profile file into the project and validate', async () => {
      await projectWizard.importProfile(Profile);
    });

    await test.step('Step 4: Select the card validation type as Virtual Card Image', async () => {
      await projectWizard.selectVirtualCardImageValidation();
    });

    await test.step('Step 5: Import the virtual card image', async () => {
      await projectWizard.importCardImage(Cardimage);
    });

    await test.step('Step 6: Validate the imported virtual card image', async () => {
      await projectWizard.validateImportedCardImage();
    });

    await test.step('Step 7-9: Run pre-requisite test cases across CT/CTL/Magstripe without interruption', async () => {
      await projectWizard.runPrerequisiteTests();
    });

    await test.step('Step 10: Generate transaction logs from pre-requisite execution', async () => {
      await projectWizard.confirmTransactionLogsGenerated();
    });

    await test.step('Step 11: Answer ICS questions - auto-fill + manual', async () => {
      await projectWizard.answerIcsQuestions('Ritish', 'CP01');
    });

    await test.step('Step 12: Finalise and complete project creation', async () => {
      await projectWizard.finaliseProjectCreation();
    });

    // Declared here (loop-body scope) so both Step 14 and Step 15 can see
    // the same value -- assigning inside a test.step callback with `const`
    // makes it die with that callback, which was the earlier bug.
    let testReportPath: string;

    await test.step('Step 14: Produce the test report and export PDF, HTML, ZIP', async () => {
      await reportsPage.openReportRow(/CP01/);
      const downloaded = await reportsPage.exportAllReports(REPORTS_DIR);

      testReportPath = downloaded.testReportPath;

      console.log('Test Report Path:', downloaded.testReportPath);
      console.log('HTML Report Path:', downloaded.htmlReportPath);
      console.log('Detailed PDF Path:', downloaded.detailedPdfPath);
      console.log('Summary PDF Path:', downloaded.summaryPdfPath);
    });

    await test.step(
      'Step 15: Compare the test report against the expected result, excluding HEADER/TRAILER',
      async () => {
        expect(
          fs.existsSync(EXPECTED_RESULT_FILE),
          `Expected baseline file not found at ${EXPECTED_RESULT_FILE}`
        ).toBeTruthy();
        expect(
          testReportPath,
          'testReportPath was not set by Step 14 -- did the "Test Report" download fail?'
        ).toBeTruthy();

        const { expectedObj, actualObj } = await compareResultXmlFiles(
          EXPECTED_RESULT_FILE,
          testReportPath
        );

        expect(actualObj).toEqual(expectedObj);

        console.log('XML files match excluding Header and Trailer');
      }
    );
  }

  await test.step('Step 16: Delete the CP01 project', async () => {
    await projectListPage.deleteProject('CP01');
  });
});
