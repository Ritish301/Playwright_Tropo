import fs from 'fs';
import { parseStringPromise } from 'xml2js';

/**
 * Remove HEADER and TRAILER nodes recursively.
 *
 * NOTE: the Tropo RESULTS XML uses <HEADER> and <TRAILER> (all caps).
 * xml2js's parseStringPromise preserves tag names exactly as written in
 * the XML -- it does not normalize case -- so deleting obj.Header /
 * obj.Trailer (mixed case) would silently delete nothing, leaving
 * FILE_DATE and SIGNATURE in place and failing the comparison every run.
 */
export function removeIgnoredNodes(obj: any): void {
  if (!obj || typeof obj !== 'object') {
    return;
  }

  delete obj.HEADER;
  delete obj.TRAILER;

  for (const key in obj) {
    removeIgnoredNodes(obj[key]);
  }
}

/**
 * Reads, parses, and strips HEADER/TRAILER from both the expected baseline
 * and actual result XML files, returning the two objects ready for
 * assertion with expect(actualObj).toEqual(expectedObj).
 */
export async function compareResultXmlFiles(
  expectedFile: string,
  actualFile: string
): Promise<{ expectedObj: any; actualObj: any }> {
  const expectedXml = fs.readFileSync(expectedFile, 'utf8');
  const actualXml = fs.readFileSync(actualFile, 'utf8');

  const expectedObj = await parseStringPromise(expectedXml);
  const actualObj = await parseStringPromise(actualXml);

  removeIgnoredNodes(expectedObj);
  removeIgnoredNodes(actualObj);

  return { expectedObj, actualObj };
}
