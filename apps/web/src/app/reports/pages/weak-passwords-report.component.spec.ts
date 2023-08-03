// eslint-disable-next-line no-restricted-imports
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { mock, MockProxy } from "jest-mock-extended";

import { I18nPipe } from "@bitwarden/angular/platform/pipes/i18n.pipe";
import { ModalService } from "@bitwarden/angular/services/modal.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { PasswordStrengthServiceAbstraction } from "@bitwarden/common/tools/password-strength";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { PasswordRepromptService } from "@bitwarden/common/vault/abstractions/password-reprompt.service";

import { cipherData } from "./reports-ciphers.mock";
import { WeakPasswordsReportComponent } from "./weak-passwords-report.component";

describe("WeakPasswordsReportComponent", () => {
  let component: WeakPasswordsReportComponent;
  let fixture: ComponentFixture<WeakPasswordsReportComponent>;
  let passwordStrengthService: MockProxy<PasswordStrengthServiceAbstraction>;

  beforeEach(() => {
    passwordStrengthService = mock<PasswordStrengthServiceAbstraction>();
    TestBed.configureTestingModule({
      declarations: [WeakPasswordsReportComponent, I18nPipe],
      providers: [
        {
          provide: CipherService,
          useValue: mock<CipherService>(),
        },
        {
          provide: PasswordStrengthServiceAbstraction,
          useValue: passwordStrengthService,
        },
        {
          provide: ModalService,
          useValue: mock<ModalService>(),
        },
        {
          provide: MessagingService,
          useValue: mock<MessagingService>(),
        },
        {
          provide: PasswordRepromptService,
          useValue: mock<PasswordRepromptService>(),
        },
        {
          provide: I18nService,
          useValue: mock<I18nService>(),
        },
      ],
      schemas: [],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WeakPasswordsReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should initialize component", () => {
    expect(component).toBeTruthy();
  });

  it('should get only ciphers with weak passwords that the user has "Can Edit" access to', async () => {
    const expectedIdOne: any = "cbea34a8-bde4-46ad-9d19-b05001228ab6";
    const expectedIdTwo = "cbea34a8-bde4-46ad-9d19-b05001228cd7";

    jest.spyOn(passwordStrengthService, "getPasswordStrength").mockReturnValue({
      password: "123",
      score: 0,
    } as any);
    jest.spyOn(component, "getAllCiphers").mockReturnValue(Promise.resolve<any>(cipherData));
    await component.setCiphers();

    expect(component.ciphers.length).toEqual(2);
    expect(component.ciphers[0].id).toEqual(expectedIdOne);
    expect(component.ciphers[1].id).toEqual(expectedIdTwo);
  });
});
