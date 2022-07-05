import { Component } from "@angular/core";
import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { By } from "@angular/platform-browser";

import { ButtonGroupComponent } from "./button-group.component";
import { ButtonGroupModule } from "./button-group.module";

describe("Button", () => {
  let mockGroupComponent: MockedButtonGroupComponent;
  let fixture: ComponentFixture<TestApp>;
  let testAppComponent: TestApp;
  let radioButton: HTMLInputElement;

  beforeEach(waitForAsync(() => {
    mockGroupComponent = new MockedButtonGroupComponent();

    TestBed.configureTestingModule({
      imports: [ButtonGroupModule],
      declarations: [TestApp],
      providers: [{ provide: ButtonGroupComponent, useValue: mockGroupComponent }],
    });

    TestBed.compileComponents();
    fixture = TestBed.createComponent(TestApp);
    testAppComponent = fixture.debugElement.componentInstance;
    radioButton = fixture.debugElement.query(By.css("input[type=radio]")).nativeElement;
  }));

  it("should emit value when clicking on radio button", () => {
    testAppComponent.value = "value";
    fixture.detectChanges();

    radioButton.click();
    fixture.detectChanges();

    expect(mockGroupComponent.onInputInteraction).toHaveBeenCalledWith("value");
  });
});

class MockedButtonGroupComponent implements Partial<ButtonGroupComponent> {
  onInputInteraction = jest.fn();
}

@Component({
  selector: "test-app",
  template: ` <bit-button-group-element [value]="value">Element</bit-button-group-element>`,
})
class TestApp {
  value?: string;
}
