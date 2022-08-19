export class LoginAuthData {
  captchaToken?: string;

  constructor(
    readonly email: string,
    readonly accessCode: string,
    readonly authRequestId: string,
    readonly masterKey: ArrayBuffer,
    readonly masterPasswordHash: ArrayBuffer
  ) {}
}
