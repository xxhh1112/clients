import { mockEnc } from "../../../spec/utils";
import { FieldType } from "../../enums/fieldType";
import { Field } from "../domain/field";

import { FieldView } from "./field.view";

describe("FieldView", () => {
  it("Decrypt", async () => {
    const field = new Field();
    field.type = FieldType.Text;
    field.name = mockEnc("encName");
    field.value = mockEnc("encValue");

    const view = await FieldView.decrypt(null, null, field);

    expect(view).toEqual({
      type: 0,
      name: "encName",
      value: "encValue",
      newField: false,
      showCount: false,
      showValue: false,
    });
  });
});
