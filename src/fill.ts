import Airtable from "airtable";
import axios from "axios";
import { load } from "cheerio";

const titleCase = (str: string) =>
  str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
const unique = (array: any[], propertyName: string) =>
  array.filter((e, i) => array.findIndex((a) => a[propertyName] === e[propertyName]) === i);

export const fill = async <T>(row: Airtable.Record<T>) => {
  const fields = (row.fields as any) as { [index: string]: string | number | any[] };
  const url = fields.Link;
  if (typeof url !== "string") return fields;
  let data: any = {};
  if (url.includes("pfister.ch")) data = await getDataFromPfister(url);
  else if (url.includes("livique.ch")) data = await getDataFromLivique(url);
  else return fields;
  fields.Name = data.title;
  fields["Full price"] = Math.round(data.fullPrice * 1.1);
  fields["Retail price"] = Math.round(data.salePrice ?? data.fullPrice);
  fields["Discounted price"] = Math.round(data.salePrice ?? data.fullPrice);
  fields["Delivery time"] = data.deliveryTime;
  fields.Description = data.description;
  fields.Specifications = JSON.stringify(data.specifications);
  const pastPhotos = fields.Photo;
  const newPhotos = (data.images ?? []).map((url: string) => ({ url }));
  fields.Photo = unique([...(pastPhotos as any[]), ...newPhotos], "url");
  return fields;
};

export const getDataFromLivique = async (url: string) => {
  const { data } = await axios.get(url);
  const $ = load(data);
  const title = $("h1").text();
  const salePrice = $(".product-detail-price__cost--final__value")
    .text()
    .replace("'", "")
    .replace(/[0-9]*\.?[0-9]*/g, "");
  const fullPrice = $(".product-detail-price__cost--old")
    .text()
    .replace("'", "")
    .replace(/[0-9]*\.?[0-9]*/g, "");
  const deliveryTime = $("[data-delivery-conditions-2-delivery] .delivery-conditions-2__value")
    .text()
    .replace("(", "")
    .replace(")", "");
  const specifications: { [index: string]: string } = {};
  $(".product-information-list__row").each((_, elt) => {
    const key = $(elt).find(".col-sm-3").text();
    const value = $(elt).find(".col-sm-9").text();
    specifications[key] = value;
  });
  const images: string[] = [];
  $("#detail-gallery source").each((_, elt) => {
    const src = $(elt).attr("srcset");
    if (src)
      images.push(
        src
          .split(",")
          .map((i) => i.trim())
          .pop()
          ?.split(" ")[0] ?? ""
      );
  });
  return {
    title,
    salePrice,
    fullPrice,
    deliveryTime,
    specifications,
    description: title,
    images: images.filter((i) => i).map((i) => (i.startsWith("http") ? i : `https:${i}`)),
  };
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
            .replace(/[0-9]*\.?[0-9]*/g, "")
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
  let deliveryTime = $("header + div[type=button]")
    .text()
    .replace("Lieferzeit: ", "")
    .replace(/ +/g, " ")
    .replace("Wochen", "weeks")
    .replace("Woche", "week");
  if (deliveryTime.includes("Sofort lieferbar")) deliveryTime = "Immediately";
  const images: string[] = [];
  $(".slick-dots picture img").each((_, elt) => {
    const src = $(elt).attr("src");
    if (src) images.push(src.replace("/pdp/", "/sm/"));
  });
  return {
    title,
    fullPrice,
    salePrice,
    description,
    specifications,
    deliveryTime,
    images: images.filter((i) => i).map((i) => (i.startsWith("http") ? i : `https:${i}`)),
  };
};
