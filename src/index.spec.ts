import { getDataFromLivique, getDataFromMaisonsDuMonde, getDataFromPfister } from "./fill";

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

test("Get data from Livique", async () => {
  const data = await getDataFromLivique(
    "https://www.livique.ch/de/schlafen/kommoden/nachttische/nachttisch-aura/p/6482340"
  );
  expect(data.title).toBe("Nachttisch Aura");
  expect(data.fullPrice).toBe(299);
  expect(data.description).toBe("Nachttisch Aura");
  expect(typeof data.specifications).toBe("object");
  expect(Object.keys(data.specifications).length).toBeGreaterThanOrEqual(1);
  expect(data.deliveryTime == null).toBeFalsy();
});

// test("Get data from Maisons du Monde", async () => {
//   const data = await getDataFromMaisonsDuMonde(
//     "https://www.maisonsdumonde.com/FR/fr/p/statue-fleurs-en-metal-dore-h41-ginko-207889.htm"
//   );
//   expect(data.title).toBe("Statue fleurs en métal doré H41");
//   expect(data.fullPrice).toBe(22);
//   expect(data.description).toBe("Statue fleurs en métal doré H41");
//   expect(typeof data.specifications).toBe("object");
//   expect(Object.keys(data.specifications).length).toBeGreaterThanOrEqual(1);
// });
