import { test, expect } from '@playwright/test';
import fs from 'fs'
const jsonpath ="Test data/Tropo_Testdata.json";
const Testdata: any = JSON.parse(fs.readFileSync(jsonpath,'utf-8'));

test("test_projects", async ({ page }) => {
  await page.goto('http://localhost:3002/dashboard');
  await page.getByRole('link', { name: 'Projects', exact: true }).click();
  {   
for (const {Project_Name,Profile,Cardimage} of Testdata) {

  await page.getByRole('button', { name: 'plus   Create Project' }).click();
  await page.getByRole('textbox').click();
  await page.getByRole('textbox').fill(Project_Name);
  await page.getByText('Select', { exact: true }).click();
  await page.getByText('Mastercard').click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
 await page.locator('input[type="file"]').setInputFiles(Profile);
 await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByTitle('Explore the Card Images').getByRole('radio').click();
 await page.getByRole('button', { name: 'Next', exact: true }).click();
 await page.locator('input[type="file"]').setInputFiles(Cardimage);
await page.getByRole('button', { name: 'Next', exact: true }).click();
await page.getByRole('button', { name: 'Execute Transaction' }).click();
 await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('textbox').first().click();
  await page.getByRole('textbox').first().fill('Ritish');
  await page.getByRole('textbox').nth(1).click();
  await page.getByRole('textbox').nth(1).fill('CP01');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Ok' }).click();
  await expect(page.getByText('Done')).toBeVisible({timeout: 120000});
}
  }

});
