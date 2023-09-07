export enum FeatureFlag {
  DisplayEuEnvironmentFlag = "display-eu-environment",
  DisplayLowKdfIterationWarningFlag = "display-kdf-iteration-warning",
  TrustedDeviceEncryption = "trusted-device-encryption",
  SecretsManagerBilling = "sm-ga-billing",
}

// Replace this with a type safe lookup of the feature flag values in PM-2282
export type FeatureFlagValue = number | string | boolean;
