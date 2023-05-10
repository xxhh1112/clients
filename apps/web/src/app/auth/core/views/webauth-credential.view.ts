export class WebauthnCredentialView {
  id: string;
  name: string;
  prf: "active" | "inactive" | "unsupported";
}
