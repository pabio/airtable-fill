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
  fields["Full price"] = Math.round(data.fullPrice);
  fields["Retail price"] = Math.round(data.salePrice ?? data.fullPrice);
  fields["Discounted price"] = Math.round(data.discountedPrice);
  fields["Delivery time"] = data.deliveryTime;
  fields.Description = data.description;
  fields.Specifications = Object.keys(data.specifications)
    .map(
      (key) =>
        `${key.replace(/\s+/g, " ").trim()}: ${data.specifications[key]
          .replace(/\s+/g, " ")
          .trim()}`
    )
    .join("\n");
  const pastPhotos = fields.Photo;
  const newPhotos = (data.images ?? []).map((url: string) => ({ url }));
  fields.Photo = unique([...((pastPhotos ?? []) as any[]), ...newPhotos], "url");
  return fields;
};

export const getDataFromLivique = async (url: string) => {
  const { data } = await axios.get(url);
  const $ = load(data);
  const title = $("h1").text();
  const salePrice = $(".product-detail-price__cost--final__value")
    .text()
    .replace("'", "")
    .replace("CHF", "")
    .replace(".-", "");
  const fullPrice = $(".product-detail-price__cost--old")
    .text()
    .replace("'", "")
    .replace("CHF", "")
    .replace(".-", "")
    .replace("statt ", "");
  const deliveryTime = $("[data-delivery-conditions-2-delivery] .delivery-conditions-2__value")
    .first()
    .text()
    .replace("(", "")
    .split(")")[0];
  const specifications: { [index: string]: string } = {};
  $(".product-information-list__row").each((_, elt) => {
    const key = $(elt).find(".col-sm-3").text();
    const value = $(elt).find(".col-sm-9").text();
    specifications[key] = value;
  });
  const images: string[] = [];
  $("#detail-gallery source:first-child").each((_, elt) => {
    const src = $(elt).first().attr("data-srcset");
    if (src)
      images.push(
        src
          .split(",")
          .map((i) => i.trim())
          .pop()
          ?.split(" ")[0] ?? ""
      );
  });
  const discountedPrice = parseInt(salePrice) * 0.7;
  return {
    title,
    salePrice,
    fullPrice,
    deliveryTime,
    specifications,
    discountedPrice,
    description: title,
    images: images.filter((i) => i).map((i) => `https:${i}`),
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
        parseInt($(price).text().replace("'", "").replace("CHF", "").replace(".-", "").trim())
      )
    );
  const [fullPrice, salePrice] = prices.sort((a, b) => b - a);
  const discountedPrice = salePrice;
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
  try {
    const obj = JSON.parse("[" + data.split(`"galleryImages":[`)[1].split(`}]}],`)[0] + "}]}]");
    obj.forEach((val: any) => {
      if (Array.isArray(val.formats)) {
        val.formats.forEach((format: { qualifier?: string; url?: string }) => {
          if (format.qualifier === "product_xl" && format.url) images.push(format.url);
        });
      }
    });
  } catch (error) {}
  return {
    title,
    fullPrice,
    salePrice,
    description,
    specifications,
    deliveryTime,
    discountedPrice,
    images: images.filter((i) => i).map((i) => (i.startsWith("http") ? i : `https:${i}`)),
  };
};
