import Airtable from "airtable";
import { cosmicSync, config } from "@anandchowdhary/cosmic";
import { fill } from "./fill";
cosmicSync("airtablefill");

interface Row {
  name: string;
}

const base = new Airtable({
  apiKey: config<string>("airtableApiKey"),
}).base(config<string>("airtableBase"));

/** Get all rows for a table */
export const getAllAirtableRows = <T = any>(): Promise<Array<Airtable.Record<T>>> =>
  new Promise((resolve, reject) => {
    const allRecords: Array<any> = [];
    base(config<string>("airtableTable"))
      .select({ maxRecords: 100 })
      .eachPage((records, fetchNextPage) => {
        allRecords.push(...records);
        fetchNextPage();
      })
      .then(() => resolve(allRecords))
      .catch(reject);
  });

/** Get a list of all rows that have an empty column */
export const getEmptyAirtableRows = async <T>() =>
  (await getAllAirtableRows<T>()).filter((row) => {
    const fields = config<string[]>("fields");
    let hasAll = true;
    fields.forEach((field) => {
      hasAll = hasAll && !!(row.fields as { [index: string]: any })[field];
    });
    return !hasAll;
  });

/** Fill empty Airtable rows */
export const airtableFill = async () => {
  const rows = await getEmptyAirtableRows<Row>();
  console.log("Got empty rows", rows.length);
  for await (const row of rows) {
    const newValues = await fill<Row>(row);
    await base(config<string>("airtableTable")).update(row.id, newValues);
    console.log("Updated row", row.id);
  }
};
