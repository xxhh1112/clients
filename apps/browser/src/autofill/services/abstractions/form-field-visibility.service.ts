interface FormFieldVisibilityService {
  isFieldViewable: (element: HTMLElement) => Promise<boolean>;
  isFieldHiddenByCss: (element: HTMLElement) => boolean;
}

export { FormFieldVisibilityService };
