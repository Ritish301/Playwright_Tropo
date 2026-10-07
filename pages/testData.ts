import fs from 'fs';

export interface TropoTestDataRow {
  Project_Name: string;
  Profile: string;
  Cardimage: string;
}

export function loadTestData(jsonPath: string): TropoTestDataRow[] {
  return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
}
