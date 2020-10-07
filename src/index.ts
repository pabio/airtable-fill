import Airtable from "airtable";
import { cosmicSync, config } from "@anandchowdhary/cosmic";
import { fill } from "./fill";
cosmicSync("airtablefill");

interface Row {
  Name: string;
}

const base = new Airtable({
  apiKey: config<string>("airtableApiKey"),
}).base(config<string>("airtableBase"));

/** Get all rows for a table */
export const getAllAirtableRows = <T = any>(table: string): Promise<Array<Airtable.Record<T>>> =>
  new Promise((resolve, reject) => {
    const allRecords: Array<any> = [];
    base(table)
      .select()
      .eachPage((records, fetchNextPage) => {
        allRecords.push(...records);
        fetchNextPage();
      })
      .then(() => resolve(allRecords))
      .catch(reject);
  });

/** Get a list of all rows that have an empty column */
export const getEmptyAirtableRows = async <T>(table: string) =>
  (await getAllAirtableRows<T>(table)).filter(
    (row) => !(row as any).fields.Description || !("Description" in (row as any).fields)
  );

/** Fill empty Airtable rows */
export const airtableFill = async () => {
  const tables = config<string>("airtableTable");
  for await (const table of tables.split(",").map((i) => i.trim())) {
    console.log("Starting update for table", table);
    const rows = await getEmptyAirtableRows<Row>(table);
    console.log("Got empty rows", rows.length);
    for await (const row of rows) {
      try {
        const newValues = await fill<Row>(row);
        console.log(newValues);
        await base(table).update([{ id: row.id, fields: { ...newValues } }]);
        console.log("Updated row", row.fields.Name);
      } catch (error) {
        console.log("Got an error in updating", row.fields.Name);
        console.log(error);
      }
    }
  }
};
airtableFill()
  .then(() => {})
  .catch(console.log);
