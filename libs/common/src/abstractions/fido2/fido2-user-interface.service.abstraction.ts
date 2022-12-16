export abstract class Fido2UserInterfaceService {
  verifyUser: () => Promise<boolean>;
  verifyPresence: () => Promise<boolean>;
  confirmNewCredential: () => Promise<boolean>;
}
