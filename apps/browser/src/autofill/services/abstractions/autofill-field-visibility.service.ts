interface AutofillFieldVisibilityService {
  isFieldViewable: (element: HTMLElement) => Promise<boolean>;
  isFieldHiddenByCss: (element: HTMLElement) => boolean;
}

export { AutofillFieldVisibilityService };
