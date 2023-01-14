import { Jsonify } from "type-fest";

import { nullableFactory } from "../../interfaces/crypto.interface";
import { IdentityData } from "../data/identity.data";

import { EncString } from "./enc-string";

export class Identity {
  title: EncString;
  firstName: EncString;
  middleName: EncString;
  lastName: EncString;
  address1: EncString;
  address2: EncString;
  address3: EncString;
  city: EncString;
  state: EncString;
  postalCode: EncString;
  country: EncString;
  company: EncString;
  email: EncString;
  phone: EncString;
  ssn: EncString;
  username: EncString;
  passportNumber: EncString;
  licenseNumber: EncString;

  constructor(obj?: IdentityData) {
    if (obj == null) {
      return;
    }

    this.title = nullableFactory(EncString, obj.title);
    this.firstName = nullableFactory(EncString, obj.firstName);
    this.middleName = nullableFactory(EncString, obj.middleName);
    this.lastName = nullableFactory(EncString, obj.lastName);
    this.address1 = nullableFactory(EncString, obj.address1);
    this.address2 = nullableFactory(EncString, obj.address2);
    this.address3 = nullableFactory(EncString, obj.address3);
    this.city = nullableFactory(EncString, obj.city);
    this.state = nullableFactory(EncString, obj.state);
    this.postalCode = nullableFactory(EncString, obj.postalCode);
    this.country = nullableFactory(EncString, obj.country);
    this.company = nullableFactory(EncString, obj.company);
    this.email = nullableFactory(EncString, obj.email);
    this.phone = nullableFactory(EncString, obj.phone);
    this.ssn = nullableFactory(EncString, obj.ssn);
    this.username = nullableFactory(EncString, obj.username);
    this.passportNumber = nullableFactory(EncString, obj.passportNumber);
    this.licenseNumber = nullableFactory(EncString, obj.licenseNumber);
  }

  toIdentityData(): IdentityData {
    const data = new IdentityData();

    data.title = this.title?.encryptedString;
    data.firstName = this.firstName?.encryptedString;
    data.middleName = this.middleName?.encryptedString;
    data.lastName = this.lastName?.encryptedString;
    data.address1 = this.address1?.encryptedString;
    data.address2 = this.address2?.encryptedString;
    data.address3 = this.address3?.encryptedString;
    data.city = this.city?.encryptedString;
    data.state = this.state?.encryptedString;
    data.postalCode = this.postalCode?.encryptedString;
    data.country = this.country?.encryptedString;
    data.company = this.company?.encryptedString;
    data.email = this.email?.encryptedString;
    data.phone = this.phone?.encryptedString;
    data.ssn = this.ssn?.encryptedString;
    data.username = this.username?.encryptedString;
    data.passportNumber = this.passportNumber?.encryptedString;
    data.licenseNumber = this.licenseNumber?.encryptedString;

    return data;
  }

  static fromJSON(obj: Jsonify<Identity>): Identity {
    if (obj == null) {
      return null;
    }

    return Object.assign(new Identity(), obj, {
      title: nullableFactory(EncString, obj.title),
      firstName: nullableFactory(EncString, obj.firstName),
      middleName: nullableFactory(EncString, obj.middleName),
      lastName: nullableFactory(EncString, obj.lastName),
      address1: nullableFactory(EncString, obj.address1),
      address2: nullableFactory(EncString, obj.address2),
      address3: nullableFactory(EncString, obj.address3),
      city: nullableFactory(EncString, obj.city),
      state: nullableFactory(EncString, obj.state),
      postalCode: nullableFactory(EncString, obj.postalCode),
      country: nullableFactory(EncString, obj.country),
      company: nullableFactory(EncString, obj.company),
      email: nullableFactory(EncString, obj.email),
      phone: nullableFactory(EncString, obj.phone),
      ssn: nullableFactory(EncString, obj.ssn),
      username: nullableFactory(EncString, obj.username),
      passportNumber: nullableFactory(EncString, obj.passportNumber),
      licenseNumber: nullableFactory(EncString, obj.licenseNumber),
    });
  }
}
