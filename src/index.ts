import Airtable from "airtable";
import { config } from "@anandchowdhary/cosmic";

/** Get all rows for a table */
export const getAllAirtableRows = <T = any>(): Promise<Array<Airtable.Record<T>>> =>
  new Promise((resolve, reject) => {
    const allRecords: Array<any> = [];
    const base = new Airtable({
      apiKey: config<string>("airtableApiKey"),
    }).base(config<string>("airtableBase"));
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
  (await getAllAirtableRows<T>()).filter((row) =>
    Object.values(row.fields).find((field: any) => !field)
  );
