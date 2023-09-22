import { EncString } from "../../platform/models/domain/enc-string";
import { Fido2KeyView } from "../../vault/models/view/fido2-key.view";

import { Fido2Key as Fido2KeyDomain } from "./../../vault/models/domain/fido2-key";

export class Fido2KeyExport {
  static template(): Fido2KeyExport {
    const req = new Fido2KeyExport();
    req.credentialId = "keyId";
    req.keyType = "keyType";
    req.keyAlgorithm = "keyAlgorithm";
    req.keyCurve = "keyCurve";
    req.keyValue = "keyValue";
    req.rpId = "rpId";
    req.userHandle = "userHandle";
    req.counter = "counter";
    req.rpName = "rpName";
    req.userDisplayName = "userDisplayName";
    req.discoverable = "false";
    req.creationDate = null;
    return req;
  }

  static toView(req: Fido2KeyExport, view = new Fido2KeyView()) {
    view.credentialId = req.credentialId;
    view.keyType = req.keyType as "public-key";
    view.keyAlgorithm = req.keyAlgorithm as "ECDSA";
    view.keyCurve = req.keyCurve as "P-256";
    view.keyValue = req.keyValue;
    view.rpId = req.rpId;
    view.userHandle = req.userHandle;
    view.counter = parseInt(req.counter);
    view.rpName = req.rpName;
    view.userDisplayName = req.userDisplayName;
    view.discoverable = req.discoverable === "true";
    view.creationDate = new Date(req.creationDate);
    return view;
  }

  static toDomain(req: Fido2KeyExport, domain = new Fido2KeyDomain()) {
    domain.credentialId = req.credentialId != null ? new EncString(req.credentialId) : null;
    domain.keyType = req.keyType != null ? new EncString(req.keyType) : null;
    domain.keyAlgorithm = req.keyAlgorithm != null ? new EncString(req.keyAlgorithm) : null;
    domain.keyCurve = req.keyCurve != null ? new EncString(req.keyCurve) : null;
    domain.keyValue = req.keyValue != null ? new EncString(req.keyValue) : null;
    domain.rpId = req.rpId != null ? new EncString(req.rpId) : null;
    domain.userHandle = req.userHandle != null ? new EncString(req.userHandle) : null;
    domain.counter = req.counter != null ? new EncString(req.counter) : null;
    domain.rpName = req.rpName != null ? new EncString(req.rpName) : null;
    domain.userDisplayName =
      req.userDisplayName != null ? new EncString(req.userDisplayName) : null;
    domain.discoverable = req.discoverable != null ? new EncString(req.discoverable) : null;
    domain.creationDate = req.creationDate;
    return domain;
  }

  credentialId: string;
  keyType: string;
  keyAlgorithm: string;
  keyCurve: string;
  keyValue: string;
  rpId: string;
  userHandle: string;
  counter: string;
  rpName: string;
  userDisplayName: string;
  discoverable: string;
  creationDate: Date = null;

  constructor(o?: Fido2KeyView | Fido2KeyDomain) {
    if (o == null) {
      return;
    }

    if (o instanceof Fido2KeyView) {
      this.credentialId = o.credentialId;
      this.keyType = o.keyType;
      this.keyAlgorithm = o.keyAlgorithm;
      this.keyCurve = o.keyCurve;
      this.keyValue = o.keyValue;
      this.rpId = o.rpId;
      this.userHandle = o.userHandle;
      this.counter = String(o.counter);
      this.rpName = o.rpName;
      this.userDisplayName = o.userDisplayName;
      this.discoverable = String(o.discoverable);
      this.creationDate = o.creationDate;
    } else {
      this.credentialId = o.credentialId?.encryptedString;
      this.keyType = o.keyType?.encryptedString;
      this.keyAlgorithm = o.keyAlgorithm?.encryptedString;
      this.keyCurve = o.keyCurve?.encryptedString;
      this.keyValue = o.keyValue?.encryptedString;
      this.rpId = o.rpId?.encryptedString;
      this.userHandle = o.userHandle?.encryptedString;
      this.counter = o.counter?.encryptedString;
      this.rpName = o.rpName?.encryptedString;
      this.userDisplayName = o.userDisplayName?.encryptedString;
      this.discoverable = o.discoverable?.encryptedString;
      this.creationDate = o.creationDate;
    }
  }
}
