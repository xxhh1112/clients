/**
 * The Document with additional custom properties added by this script
 */
export type AutofillDocument = Document & {
  elementsByOPID: Record<string, Element>;
  elementForOPID: (opId: string) => Element | null;
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
