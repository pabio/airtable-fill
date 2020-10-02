import Airtable from "airtable";
import axios from "axios";
import { load } from "cheerio";

const titleCase = (str: string) =>
  str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

export const fill = async <T>(row: Airtable.Record<T>) => {
  return row.fields;
};

export const getDataFromPfister = async (url: string) => {
  const { data } = await axios.get(url);
  const $ = load(data);
  const title = titleCase($("h1").text());
  const prices: number[] = [];
  $("h1 + div")
    .find("span")
    .each((_, price) =>
      prices.push(
        parseInt(
          $(price)
            .text()
            .replace(/[^0-9]/g, "")
        )
      )
    );
  const [fullPrice, salePrice] = prices.sort((a, b) => b - a);
  const description = $("h2")
    .filter((_, elt) => $(elt).text().trim() === "Details")
    .next()
    .text();
  const specifications: { [index: string]: string } = {};
  const table = $("h2")
    .filter((_, elt) => $(elt).text().trim() === "Details")
    .siblings("table");
  table.find("tr").each((_, elt) => {
    const key = $(elt).find("th").text();
    const value = $(elt).find("td").text();
    specifications[key] = value;
  });
  return { title, fullPrice, salePrice, description, specifications };
};
