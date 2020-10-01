import Airtable from "airtable";

export const fill = async <T>(row: Airtable.Record<T>) => {
  return row.fields;
};
