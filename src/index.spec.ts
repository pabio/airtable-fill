import { getDataFromPfister } from "./fill";

test("get data from pfister", async () => {
  const data = await getDataFromPfister(
    "https://www.pfister.ch/de/produkt/186301/pfister-eigenmarke-sessel-winged"
  );
  console.log(data);
});
