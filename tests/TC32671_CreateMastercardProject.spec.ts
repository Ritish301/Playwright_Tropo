import { test } from '@playwright/test';
import path from 'path';
import { CreateProjectPage } from '../pages/CreateProjectPage';
import { ProjectListPage } from '../pages/ProjectListPage';

/**
 * TC-32671 (Project PR-33)
 * "End-to-End - Create a Mastercard project successfully via the full wizard"
 *
 * This mirrors the manual run executed on 2026-09-18 against
 * http://localhost:3002, including the actual field values used
 * (Operator Name: Ritish, Card Name: CP01).
 *
 * Precondition files:
 *   - CP01_PROF_v326.profile
 *   - CP01_IMG.xml
 * Update PROFILE_FILE_PATH / CARD_IMAGE_FILE_PATH below (or move the files
 * into a `test-data/` folder next to this spec and adjust the path.resolve
 * calls) to match your local environment.
 */

const BASE_URL = 'http://localhost:3002';

// TODO: point these at your local copies of the precondition files.
const PROFILE_FILE_PATH = path.resolve(__dirname, '../Test data/CP01_PROF_v326.profile');
const CARD_IMAGE_FILE_PATH = path.resolve(__dirname, '../Test data/CP01_IMG.xml');
const CARD_IMAGE_FILE_NAME = 'CP01_IMG.xml';

const PROJECT_NAME = `TC32671_E2E_${Date.now()}`;
const SCHEME = 'Mastercard' as const;
const OPERATOR_NAME = 'Ritish';
const CARD_NAME = 'CP01';
const SUPPORTED_AID = 'A0000000041010';

test.describe('TC-32671 - End-to-End Mastercard project creation', () => {
  test('creates a Mastercard project through the full 8-step wizard and reaches Done status', async ({
    page,
  }) => {
    const createProjectPage = new CreateProjectPage(page);
    const projectListPage = new ProjectListPage(page);

    // Step 1: Project Information
    await createProjectPage.goto(BASE_URL);
    await createProjectPage.enterProjectInformation(PROJECT_NAME, SCHEME);
    await createProjectPage.clickNext();

    // Step 2: Select Profile
    await createProjectPage.uploadProfile(PROFILE_FILE_PATH);
    await createProjectPage.clickNext();

    // Step 3: Select Card Type
    await createProjectPage.selectCardType('Explore the Card Images');
    await createProjectPage.clickNext();

    // Step 4: Input Card Image
    await createProjectPage.uploadCardImage(CARD_IMAGE_FILE_PATH, CARD_IMAGE_FILE_NAME);
    await createProjectPage.clickNext();

    // Step 5: Explore Card Image / Execute Transaction
    await createProjectPage.executeTransactionAndWaitForCounts();
    await createProjectPage.clickNext();

    // Step 6: Applications List (view-only)
    await createProjectPage.assertApplicationsListSupported(SUPPORTED_AID);
    await createProjectPage.clickNext();

    // Step 7: ICS Questions
    await createProjectPage.fillIcsQuestions(OPERATOR_NAME, CARD_NAME);
    await createProjectPage.clickNext();

    // Step 8: Confirm Details (ICS Summary)
    await createProjectPage.assertIcsSummary({
      projectName: PROJECT_NAME,
      scheme: SCHEME,
      operatorName: OPERATOR_NAME,
      cardName: CARD_NAME,
    });

    // Step 9: Next -> Ok finalizes project creation
    await createProjectPage.finalizeProject();

    // Step 10: Project List - new project appears and reaches 'Done' status
    await projectListPage.assertProjectVisible(PROJECT_NAME, SCHEME);
    await projectListPage.waitForDoneStatus(PROJECT_NAME);
    await projectListPage.assertExportReportEnabled(PROJECT_NAME);
  });
});
