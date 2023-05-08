/**
 * The Document with additional custom properties added by this script
 */
export type AutofillDocument = Document & {
  elementsByOPID: Record<string, Element>;
  elementForOPID: (opId: string) => Element;
};

/**
 * A HTMLElement (usually a form element) with additional custom properties added by this script
 */
export type ElementWithOpId<T> = T & {
  opid: string;
};

/**
 * This script's definition of a Form Element (only a subset of HTML form elements)
 * This is defined by getFormElements
 */
export type FormElement = HTMLInputElement | HTMLSelectElement | HTMLSpanElement;

/**
 * A Form Element that we can set a value on (fill)
 */
export type FillableControl = HTMLInputElement | HTMLSelectElement;
