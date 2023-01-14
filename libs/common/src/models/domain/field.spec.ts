import { mockFromJson } from "../../../spec/utils";
import { FieldType } from "../../enums/fieldType";
import { FieldData } from "../data/field.data";

import { EncString } from "./enc-string";
import { Field } from "./field";

describe("Field", () => {
  let data: FieldData;

  beforeEach(() => {
    data = {
      type: FieldType.Text,
      name: "encName",
      value: "encValue",
      linkedId: null,
    };
  });

  it("Convert from empty", () => {
    const data = new FieldData();
    const field = new Field(data);

    expect(field).toEqual({
      type: undefined,
      name: null,
      value: null,
      linkedId: undefined,
    });
  });

  it("Convert", () => {
    const field = new Field(data);

    expect(field).toEqual({
      type: FieldType.Text,
      name: { encryptedString: "encName", encryptionType: 0 },
      value: { encryptedString: "encValue", encryptionType: 0 },
      linkedId: null,
    });
  });

  it("toFieldData", () => {
    const field = new Field(data);
    expect(field.toFieldData()).toEqual(data);
  });

  describe("fromJSON", () => {
    it("initializes nested objects", () => {
      jest.spyOn(EncString, "fromJSON").mockImplementation(mockFromJson);

      const actual = Field.fromJSON({
        name: "myName",
        value: "myValue",
      });

      expect(actual).toEqual({
        name: { encryptedString: "myName", encryptionType: 0 },
        value: { encryptedString: "myValue", encryptionType: 0 },
      });
      expect(actual).toBeInstanceOf(Field);
    });

    it("returns null if object is null", () => {
      expect(Field.fromJSON(null)).toBeNull();
    });
  });
});
