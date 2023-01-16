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

  describe("maskedCode", () => {
    it.each([
      ["", ""],
      ["1", "•"],
      ["12", "••"],
      ["123", "•••"],
      ["1234", "••••"],
    ])("%s is %s", (number, expected) => {
      const view = new CardView();
      view.code = number;

      expect(view.maskedCode).toEqual(expected);
    });
  });

  describe("maskedNumber", () => {
    it.each([
      [null, null],
      ["", ""],
      ["1", "•"],
      ["12", "••"],
      ["123", "•••"],
      ["1234567890123456", "••••••••••••••••"],
    ])("%s is %s", (number, expected) => {
      const view = new CardView();
      view.number = number;

      expect(view.maskedNumber).toEqual(expected);
    });
  });

  describe("subTitle", () => {
    it.each([
      ["", "", ""],
      ["4242424242424242", "Visa", "Visa, *4242"],
      ["5555555555554444", "Mastercard", "Mastercard, *4444"],
      ["378282246310005", "American Express", "American Express, *10005"],
    ])("%s is %s", (number, brand, expected) => {
      const view = new CardView();
      view.number = number;
      view.brand = brand;

      expect(view.subTitle).toEqual(expected);
    });
  });
});
