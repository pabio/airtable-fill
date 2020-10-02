import { getDataFromPfister } from "./fill";

test("Get data from Pfister", async () => {
  const data = await getDataFromPfister(
    "https://www.pfister.ch/de/produkt/186301/pfister-eigenmarke-sessel-winged"
  );
  expect(data.title).toBe("Sessel Winged");
  expect(data.fullPrice).toBe(399);
  expect(data.description).toBe(
    "Sessel WINGED beflügelt. Die organisch geformte Sitzfläche aus erstklassigem Rattan bietet einen hohen Sitzkomfort. Auf dem schönen Geflecht lässt sich es sich ideal entspannen und neue Energie tanken – sei es im Wohnzimmer, auf der Terrasse oder im Garten. Inklusive Sitzkissen und Nierenkissen mit abnehmbarem Bezug aus Leinen. Exklusiv bei Pfister erhältlich."
  );
  expect(typeof data.specifications).toBe("object");
  expect(Object.keys(data.specifications).length).toBeGreaterThanOrEqual(1);
  expect(data.deliveryTime == null).toBeFalsy();
});