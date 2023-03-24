// String values affect code flow in autofill.ts and must not be changed
export enum FillScriptOp {
  click = "click_on_opid",
  focus = "focus_by_opid",
  fill = "fill_by_opid"
}

export type FillScript = [op: FillScriptOp, opid: string, value?: string]

export type AutofillScriptOptions = {
  animate?: boolean,
  markFilling?: boolean,
}

export type AutofillScriptProperties = {
  delay_between_operations?: number;
}

export default class AutofillScript {
  script: FillScript[] = [];
  documentUUID: string = "";
  properties: AutofillScriptProperties = {};
  options: AutofillScriptOptions = {};
  metadata: any = {}; // Unused, not written or read
  autosubmit: any = null; // Appears to be unused, read but not written
  savedUrls: string[];
  untrustedIframe: boolean;
  itemType: string; // Appears to be unused, read but not written

  constructor(documentUUID: string) {
    this.documentUUID = documentUUID;
  }
}
