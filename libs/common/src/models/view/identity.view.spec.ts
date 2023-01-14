import { mockEnc } from "../../../spec/utils";
import { Identity } from "../domain/identity";

import { IdentityView } from "./identity.view";

describe("IdentityView", () => {
  it("Decrypt", async () => {
    const identity = new Identity();

    identity.title = mockEnc("mockTitle");
    identity.firstName = mockEnc("mockFirstName");
    identity.middleName = mockEnc("mockMiddleName");
    identity.lastName = mockEnc("mockLastName");
    identity.address1 = mockEnc("mockAddress1");
    identity.address2 = mockEnc("mockAddress2");
    identity.address3 = mockEnc("mockAddress3");
    identity.city = mockEnc("mockCity");
    identity.state = mockEnc("mockState");
    identity.postalCode = mockEnc("mockPostalCode");
    identity.country = mockEnc("mockCountry");
    identity.company = mockEnc("mockCompany");
    identity.email = mockEnc("mockEmail");
    identity.phone = mockEnc("mockPhone");
    identity.ssn = mockEnc("mockSsn");
    identity.username = mockEnc("mockUsername");
    identity.passportNumber = mockEnc("mockPassportNumber");
    identity.licenseNumber = mockEnc("mockLicenseNumber");

    const view = await IdentityView.decrypt(null, null, identity);

    expect(view).toEqual({
      _firstName: "mockFirstName",
      _lastName: "mockLastName",
      _subTitle: null,
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
  });
});
