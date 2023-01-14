import { Jsonify } from "type-fest";

import { EncryptService } from "../../abstractions/encrypt.service";
import { IdentityLinkedId as LinkedId } from "../../enums/linkedIdType";
import { Utils } from "../../misc/utils";
import { Identity } from "../domain/identity";
import { SymmetricCryptoKey } from "../domain/symmetric-crypto-key";

import { ItemView } from "./item.view";
import { linkedFieldOption } from "./linked-field-option.decorator";

export class IdentityView extends ItemView {
  @linkedFieldOption(LinkedId.Title)
  title: string = null;
  @linkedFieldOption(LinkedId.MiddleName)
  middleName: string = null;
  @linkedFieldOption(LinkedId.Address1)
  address1: string = null;
  @linkedFieldOption(LinkedId.Address2)
  address2: string = null;
  @linkedFieldOption(LinkedId.Address3)
  address3: string = null;
  @linkedFieldOption(LinkedId.City, "cityTown")
  city: string = null;
  @linkedFieldOption(LinkedId.State, "stateProvince")
  state: string = null;
  @linkedFieldOption(LinkedId.PostalCode, "zipPostalCode")
  postalCode: string = null;
  @linkedFieldOption(LinkedId.Country)
  country: string = null;
  @linkedFieldOption(LinkedId.Company)
  company: string = null;
  @linkedFieldOption(LinkedId.Email)
  email: string = null;
  @linkedFieldOption(LinkedId.Phone)
  phone: string = null;
  @linkedFieldOption(LinkedId.Ssn)
  ssn: string = null;
  @linkedFieldOption(LinkedId.Username)
  username: string = null;
  @linkedFieldOption(LinkedId.PassportNumber)
  passportNumber: string = null;
  @linkedFieldOption(LinkedId.LicenseNumber)
  licenseNumber: string = null;

  private _firstName: string = null;
  private _lastName: string = null;
  private _subTitle: string = null;

  constructor() {
    super();
  }

  @linkedFieldOption(LinkedId.FirstName)
  get firstName(): string {
    return this._firstName;
  }
  set firstName(value: string) {
    this._firstName = value;
    this._subTitle = null;
  }

  @linkedFieldOption(LinkedId.LastName)
  get lastName(): string {
    return this._lastName;
  }
  set lastName(value: string) {
    this._lastName = value;
    this._subTitle = null;
  }

  get subTitle(): string {
    if (this._subTitle == null && (this.firstName != null || this.lastName != null)) {
      this._subTitle = "";
      if (this.firstName != null) {
        this._subTitle = this.firstName;
      }
      if (this.lastName != null) {
        if (this._subTitle !== "") {
          this._subTitle += " ";
        }
        this._subTitle += this.lastName;
      }
    }

    return this._subTitle;
  }

  @linkedFieldOption(LinkedId.FullName)
  get fullName(): string {
    if (
      this.title != null ||
      this.firstName != null ||
      this.middleName != null ||
      this.lastName != null
    ) {
      let name = "";
      if (this.title != null) {
        name += this.title + " ";
      }
      if (this.firstName != null) {
        name += this.firstName + " ";
      }
      if (this.middleName != null) {
        name += this.middleName + " ";
      }
      if (this.lastName != null) {
        name += this.lastName;
      }
      return name.trim();
    }

    return null;
  }

  get fullAddress(): string {
    let address = this.address1;
    if (!Utils.isNullOrWhitespace(this.address2)) {
      if (!Utils.isNullOrWhitespace(address)) {
        address += ", ";
      }
      address += this.address2;
    }
    if (!Utils.isNullOrWhitespace(this.address3)) {
      if (!Utils.isNullOrWhitespace(address)) {
        address += ", ";
      }
      address += this.address3;
    }
    return address;
  }

  get fullAddressPart2(): string {
    if (this.city == null && this.state == null && this.postalCode == null) {
      return null;
    }
    const city = this.city || "-";
    const state = this.state;
    const postalCode = this.postalCode || "-";
    let addressPart2 = city;
    if (!Utils.isNullOrWhitespace(state)) {
      addressPart2 += ", " + state;
    }
    addressPart2 += ", " + postalCode;
    return addressPart2;
  }

  async encrypt(encryptService: EncryptService, key: SymmetricCryptoKey): Promise<Identity> {
    const identity = new Identity();

    /*
    const fields: (keyof Identity & keyof IdentityView)[] = [
      "title",
      "firstName",
      "middleName",
      "lastName",
      "address1",
      "address2",
      "address3",
      "city",
      "state",
      "postalCode",
      "country",
      "company",
      "email",
      "phone",
      "ssn",
      "username",
      "passportNumber",
      "licenseNumber",
    ];

    await Promise.all(
      fields.map((field) => {
        if (this[field] != null) {
          return encryptService.encrypt(this[field], key).then((encrypted) => {
            identity[field] = encrypted;
          });
        }
      })
    );
    */

    [
      identity.title,
      identity.firstName,
      identity.middleName,
      identity.lastName,
      identity.address1,
      identity.address2,
      identity.address3,
      identity.city,
      identity.state,
      identity.postalCode,
      identity.country,
      identity.company,
      identity.email,
      identity.phone,
      identity.ssn,
      identity.username,
      identity.passportNumber,
      identity.licenseNumber,
    ] = await Promise.all([
      this.title ? encryptService.encrypt(this.title, key) : null,
      this.firstName ? encryptService.encrypt(this.firstName, key) : null,
      this.middleName ? encryptService.encrypt(this.middleName, key) : null,
      this.lastName ? encryptService.encrypt(this.lastName, key) : null,
      this.address1 ? encryptService.encrypt(this.address1, key) : null,
      this.address2 ? encryptService.encrypt(this.address2, key) : null,
      this.address3 ? encryptService.encrypt(this.address3, key) : null,
      this.city ? encryptService.encrypt(this.city, key) : null,
      this.state ? encryptService.encrypt(this.state, key) : null,
      this.postalCode ? encryptService.encrypt(this.postalCode, key) : null,
      this.country ? encryptService.encrypt(this.country, key) : null,
      this.company ? encryptService.encrypt(this.company, key) : null,
      this.email ? encryptService.encrypt(this.email, key) : null,
      this.phone ? encryptService.encrypt(this.phone, key) : null,
      this.ssn ? encryptService.encrypt(this.ssn, key) : null,
      this.username ? encryptService.encrypt(this.username, key) : null,
      this.passportNumber ? encryptService.encrypt(this.passportNumber, key) : null,
      this.licenseNumber ? encryptService.encrypt(this.licenseNumber, key) : null,
    ]);

    return identity;
  }

  static fromJSON(obj: Partial<Jsonify<IdentityView>>): IdentityView {
    return Object.assign(new IdentityView(), obj);
  }

  static async decrypt(encryptService: EncryptService, key: SymmetricCryptoKey, model: Identity) {
    const view = new IdentityView();

    [
      view.title,
      view.firstName,
      view.middleName,
      view.lastName,
      view.address1,
      view.address2,
      view.address3,
      view.city,
      view.state,
      view.postalCode,
      view.country,
      view.company,
      view.email,
      view.phone,
      view.ssn,
      view.username,
      view.passportNumber,
      view.licenseNumber,
    ] = await Promise.all([
      model.title?.decryptWithEncryptService(encryptService, key),
      model.firstName?.decryptWithEncryptService(encryptService, key),
      model.middleName?.decryptWithEncryptService(encryptService, key),
      model.lastName?.decryptWithEncryptService(encryptService, key),
      model.address1?.decryptWithEncryptService(encryptService, key),
      model.address2?.decryptWithEncryptService(encryptService, key),
      model.address3?.decryptWithEncryptService(encryptService, key),
      model.city?.decryptWithEncryptService(encryptService, key),
      model.state?.decryptWithEncryptService(encryptService, key),
      model.postalCode?.decryptWithEncryptService(encryptService, key),
      model.country?.decryptWithEncryptService(encryptService, key),
      model.company?.decryptWithEncryptService(encryptService, key),
      model.email?.decryptWithEncryptService(encryptService, key),
      model.phone?.decryptWithEncryptService(encryptService, key),
      model.ssn?.decryptWithEncryptService(encryptService, key),
      model.username?.decryptWithEncryptService(encryptService, key),
      model.passportNumber?.decryptWithEncryptService(encryptService, key),
      model.licenseNumber?.decryptWithEncryptService(encryptService, key),
    ]);

    return view;
  }
}
