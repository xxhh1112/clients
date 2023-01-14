import { mockEnc } from "../../../spec/utils";
import { Card } from "../domain/card";

import { CardView } from "./card.view";

describe("CardView", () => {
  it("Decrypt", async () => {
    const card = new Card();
    card.cardholderName = mockEnc("cardHolder");
    card.brand = mockEnc("brand");
    card.number = mockEnc("number");
    card.expMonth = mockEnc("expMonth");
    card.expYear = mockEnc("expYear");
    card.code = mockEnc("code");

    const view = await CardView.decrypt(null, null, card);

    expect(view).toEqual({
      _brand: "brand",
      _number: "number",
      _subTitle: null,
      cardholderName: "cardHolder",
      code: "code",
      expMonth: "expMonth",
      expYear: "expYear",
    });
  });
});
