/**
 * The Document with additional custom properties added by this script
 */
export type AutofillDocument = Document & {
  elementsByOPID: Record<string, Element>;
  elementForOPID: (
    targetOpId?: string | null | undefined
  ) => FillableControl | HTMLButtonElement | null | undefined;
};

/**
 * A HTMLElement (usually a form element) with additional custom properties added by this script
 */
export type ElementWithOpId<T> = T & {
  opid: string;
};

/**
 * A Form Element that we can set a value on (fill)
 */
export type FillableControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/**
 * This script's definition of a Form Element (only a subset of HTML form elements)
 * This is defined by getFormElements
 */

export type FormElement = FillableControl | HTMLSpanElement;

export type FormElementWithAttribute = FormElement & Record<string, string | null | undefined>;

// @TODO deprecate in favor of FormElementWithAttribute?
// export type FormElementExtended = FormElement & { opid?: string };
