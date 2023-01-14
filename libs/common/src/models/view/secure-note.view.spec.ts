import { SecureNoteType } from "../../enums/secureNoteType";
import { SecureNote } from "../domain/secure-note";

import { SecureNoteView } from "./secure-note.view";

describe("SecureNoteView", () => {
  it("Decrypt", async () => {
    const model = new SecureNote();
    model.type = SecureNoteType.Generic;

    const view = await SecureNoteView.decrypt(null, null, model);

    expect(view).toEqual({
      type: 0,
    });
  });
});
