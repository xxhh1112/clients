import { IdentityData } from "../data/identity.data";

import { Identity } from "./identity";

describe("Identity", () => {
  let data: IdentityData;

  beforeEach(() => {
    data = {
      title: "enctitle",
      firstName: "encfirstName",
      middleName: "encmiddleName",
      lastName: "enclastName",
      address1: "encaddress1",
      address2: "encaddress2",
      address3: "encaddress3",
      city: "enccity",
      state: "encstate",
      postalCode: "encpostalCode",
      country: "enccountry",
      company: "enccompany",
      email: "encemail",
      phone: "encphone",
      ssn: "encssn",
      username: "encusername",
      passportNumber: "encpassportNumber",
      licenseNumber: "enclicenseNumber",
    };
  });

  it("Convert from empty", () => {
    const data = new IdentityData();
    const identity = new Identity(data);

    expect(identity).toEqual({
      address1: null,
      address2: null,
      address3: null,
      city: null,
      company: null,
      country: null,
      email: null,
      firstName: null,
      lastName: null,
      licenseNumber: null,
      middleName: null,
      passportNumber: null,
      phone: null,
      postalCode: null,
      ssn: null,
      state: null,
      title: null,
      username: null,
    });
  });

  it("Convert", () => {
    const identity = new Identity(data);

    expect(identity).toEqual({
      title: { encryptedString: "enctitle", encryptionType: 0 },
      firstName: { encryptedString: "encfirstName", encryptionType: 0 },
      middleName: { encryptedString: "encmiddleName", encryptionType: 0 },
      lastName: { encryptedString: "enclastName", encryptionType: 0 },
      address1: { encryptedString: "encaddress1", encryptionType: 0 },
      address2: { encryptedString: "encaddress2", encryptionType: 0 },
      address3: { encryptedString: "encaddress3", encryptionType: 0 },
      city: { encryptedString: "enccity", encryptionType: 0 },
      state: { encryptedString: "encstate", encryptionType: 0 },
      postalCode: { encryptedString: "encpostalCode", encryptionType: 0 },
      country: { encryptedString: "enccountry", encryptionType: 0 },
      company: { encryptedString: "enccompany", encryptionType: 0 },
      email: { encryptedString: "encemail", encryptionType: 0 },
      phone: { encryptedString: "encphone", encryptionType: 0 },
      ssn: { encryptedString: "encssn", encryptionType: 0 },
      username: { encryptedString: "encusername", encryptionType: 0 },
      passportNumber: { encryptedString: "encpassportNumber", encryptionType: 0 },
      licenseNumber: { encryptedString: "enclicenseNumber", encryptionType: 0 },
    });
  });

  it("toIdentityData", () => {
    const identity = new Identity(data);
    expect(identity.toIdentityData()).toEqual(data);
  });

  describe("fromJSON", () => {
    it("initializes nested objects", () => {
      const actual = Identity.fromJSON({
        firstName: "mockFirstName",
        lastName: "mockLastName",
        address1: "mockAddress1",
        address2: "mockAddress2",
        address3: "mockAddress3",
        city: "mockCity",
        company: "mockCompany",
        country: "mockCountry",
        email: "mockEmail",
        licenseNumber: "mockLicenseNumber",
        middleName: "mockMiddleName",
        passportNumber: "mockPassportNumber",
        phone: "mockPhone",
        postalCode: "mockPostalCode",
        ssn: "mockSsn",
        state: "mockState",
        title: "mockTitle",
        username: "mockUsername",
      });

      expect(actual).toEqual({
        firstName: { encryptedString: "mockFirstName", encryptionType: 0 },
        lastName: { encryptedString: "mockLastName", encryptionType: 0 },
        address1: { encryptedString: "mockAddress1", encryptionType: 0 },
        address2: { encryptedString: "mockAddress2", encryptionType: 0 },
        address3: { encryptedString: "mockAddress3", encryptionType: 0 },
        city: { encryptedString: "mockCity", encryptionType: 0 },
        company: { encryptedString: "mockCompany", encryptionType: 0 },
        country: { encryptedString: "mockCountry", encryptionType: 0 },
        email: { encryptedString: "mockEmail", encryptionType: 0 },
        licenseNumber: { encryptedString: "mockLicenseNumber", encryptionType: 0 },
        middleName: { encryptedString: "mockMiddleName", encryptionType: 0 },
        passportNumber: { encryptedString: "mockPassportNumber", encryptionType: 0 },
        phone: { encryptedString: "mockPhone", encryptionType: 0 },
        postalCode: { encryptedString: "mockPostalCode", encryptionType: 0 },
        ssn: { encryptedString: "mockSsn", encryptionType: 0 },
        state: { encryptedString: "mockState", encryptionType: 0 },
        title: { encryptedString: "mockTitle", encryptionType: 0 },
        username: { encryptedString: "mockUsername", encryptionType: 0 },
      });
      expect(actual).toBeInstanceOf(Identity);
    });

    it("returns null if object is null", () => {
      expect(Identity.fromJSON(null)).toBeNull();
    });
  });
});
