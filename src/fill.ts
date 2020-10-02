import Airtable from "airtable";
import axios from "axios";
import { load } from "cheerio";

const titleCase = (str: string) =>
  str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

export const fill = async <T>(row: Airtable.Record<T>) => {
  const fields = (row.fields as any) as { [index: string]: string | number };
  const url = fields.Link;
  if (typeof url !== "string") return fields;
  if (!url.includes("pfister.ch")) return fields;
  const data = await getDataFromPfister(url);
  fields.Name = data.title;
  fields["Full price"] = Math.round(data.fullPrice * 1.1);
  fields["Retail price"] = Math.round(data.salePrice ?? data.fullPrice);
  fields["Discounted price"] = Math.round(data.salePrice ?? data.fullPrice);
  fields["Delivery time"] = data.deliveryTime;
  fields.Description = data.description;
  fields.Specifications = JSON.stringify(data.specifications);
  return fields;
};

export const getDataFromPfister = async (url: string) => {
  const { data } = await axios.get(url);
  const $ = load(data);
  const title = titleCase($("h1").text());
  const prices: number[] = [];
  $("h1 + div, h2 + div")
    .find("span")
    .each((_, price) =>
      prices.push(
        parseInt(
          $(price)
            .text()
            .replace("'", "")
            .replace(/[^0-9]/g, "")
        )
      )
    );
  const [fullPrice, salePrice] = prices.sort((a, b) => b - a);
  let description = $("h2")
    .filter((_, elt) => $(elt).text().trim() === "Details")
    .next("div")
    .text();
  if (description.length < 100) description = "";
  const specifications: { [index: string]: string } = {};
  const table = $("h2")
    .filter((_, elt) => $(elt).text().trim() === "Details")
    .siblings("table");
  table.find("tr").each((_, elt) => {
    const key = $(elt).find("th").text();
    const value = $(elt).find("td").text();
    specifications[key] = value;
  });
  const deliveryTime = $("header + div[type=button]")
    .text()
    .replace("Lieferzeit: ", "")
    .replace("Sofort lieferbar,  ", "")
    .replace(/ +/g, " ");
  return { title, fullPrice, salePrice, description, specifications, deliveryTime };
};
