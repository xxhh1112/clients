import { mockFromJson } from "../../../spec/utils";
import { CardData } from "../data/card.data";

import { Card } from "./card";
import { EncString } from "./enc-string";

describe("Card", () => {
  let data: CardData;

  beforeEach(() => {
    data = {
      cardholderName: "encHolder",
      brand: "encBrand",
      number: "encNumber",
      expMonth: "encMonth",
      expYear: "encYear",
      code: "encCode",
    };
  });

  it("Convert from empty", () => {
    const data = new CardData();
    const card = new Card(data);

    expect(card).toEqual({
      cardholderName: null,
      brand: null,
      number: null,
      expMonth: null,
      expYear: null,
      code: null,
    });
  });

  it("Convert", () => {
    const card = new Card(data);

    expect(card).toEqual({
      cardholderName: { encryptedString: "encHolder", encryptionType: 0 },
      brand: { encryptedString: "encBrand", encryptionType: 0 },
      number: { encryptedString: "encNumber", encryptionType: 0 },
      expMonth: { encryptedString: "encMonth", encryptionType: 0 },
      expYear: { encryptedString: "encYear", encryptionType: 0 },
      code: { encryptedString: "encCode", encryptionType: 0 },
    });
  });

  it("toCardData", () => {
    const card = new Card(data);
    expect(card.toCardData()).toEqual(data);
  });

  describe("fromJSON", () => {
    it("initializes nested objects", () => {
      jest.spyOn(EncString, "fromJSON").mockImplementation(mockFromJson);

      const actual = Card.fromJSON({
        cardholderName: "mockCardHolder",
        brand: "mockBrand",
        number: "mockNumber",
        expMonth: "mockExpMonth",
        expYear: "mockExpYear",
        code: "mockCode",
      });

      expect(actual).toEqual({
        cardholderName: { encryptedString: "mockCardHolder", encryptionType: 0 },
        brand: { encryptedString: "mockBrand", encryptionType: 0 },
        number: { encryptedString: "mockNumber", encryptionType: 0 },
        expMonth: { encryptedString: "mockExpMonth", encryptionType: 0 },
        expYear: { encryptedString: "mockExpYear", encryptionType: 0 },
        code: { encryptedString: "mockCode", encryptionType: 0 },
      });
      expect(actual).toBeInstanceOf(Card);
    });

    it("returns null if object is null", () => {
      expect(Card.fromJSON(null)).toBeNull();
    });
  });
});
