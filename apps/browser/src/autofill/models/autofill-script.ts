// String values affect code flow in autofill.ts and must not be changed
export type FillScriptOp = "click_on_opid" | "focus_by_opid" | "fill_by_opid" | "delay";

export type FillScript = [op: FillScriptOp, opid: string, value?: string];

export type AutofillScriptOptions = {
  animate?: boolean;
  markFilling?: boolean;
};

export type AutofillScriptProperties = {
  delay_between_operations?: number;
};

export default class AutofillScript {
  script: FillScript[] = [];
  /** DEAD CODE? documentUUID is not used anywhere */
  // documentUUID = "";
  /** END DEAD CODE */
  properties: AutofillScriptProperties = {};
  options: AutofillScriptOptions = {};
  metadata: any = {}; // Unused, not written or read
  autosubmit: any = null; // Appears to be unused, read but not written
  savedUrls: string[];
  untrustedIframe: boolean;
  itemType: string; // Appears to be unused, read but not written

  /** DEAD CODE? documentUUID is not used anywhere */
  // constructor(documentUUID: string) {
  //   this.documentUUID = documentUUID;
  // }
  /** END DEAD CODE */
}
