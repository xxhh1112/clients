interface AutofillFieldVisibilityService {
  isFieldViewable: (element: HTMLElement) => Promise<boolean>;
}

export { AutofillFieldVisibilityService };
