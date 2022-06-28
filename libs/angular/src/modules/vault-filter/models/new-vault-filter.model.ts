const DefaultOptions: VaultFilterOptions = {
  selectedFolder: false,
};

export type VaultFilterOptions = Readonly<{
  selectedFolder: boolean;
}>;

export class VaultFilter implements VaultFilterOptions {
  constructor(private readonly options: Partial<VaultFilterOptions> = {}) {
    this.options = {
      ...DefaultOptions,
      ...options,
    };
  }

  get selectedFolder() {
    return this.options.selectedFolder;
  }

  update(options: Partial<VaultFilterOptions>) {
    return new VaultFilter({
      ...this.options,
      ...options,
    });
  }
}
