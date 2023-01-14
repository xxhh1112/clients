import { SecureNoteType } from "../../enums/secureNoteType";
import { SecureNoteData } from "../data/secure-note.data";

import { SecureNote } from "./secure-note";

describe("SecureNote", () => {
  let data: SecureNoteData;

  beforeEach(() => {
    data = {
      type: SecureNoteType.Generic,
    };
  });

  it("Convert from empty", () => {
    const data = new SecureNoteData();
    const secureNote = new SecureNote(data);

    expect(secureNote).toEqual({
      type: undefined,
    });
  });

  it("Convert", () => {
    const secureNote = new SecureNote(data);

    expect(secureNote).toEqual({
      type: 0,
    });
  });

  it("toSecureNoteData", () => {
    const secureNote = new SecureNote(data);
    expect(secureNote.toSecureNoteData()).toEqual(data);
  });

  describe("fromJSON", () => {
    it("returns null if object is null", () => {
      expect(SecureNote.fromJSON(null)).toBeNull();
    });
  });
});
