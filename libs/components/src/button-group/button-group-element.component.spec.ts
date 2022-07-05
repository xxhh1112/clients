import { Component } from "@angular/core";
import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { By } from "@angular/platform-browser";

import { ButtonGroupModule } from "./button-group.module";

describe("Button", () => {
  let fixture: ComponentFixture<TestApp>;
  let testAppComponent: TestApp;
  let radioButton: HTMLInputElement;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ButtonGroupModule],
      declarations: [TestApp],
    });

    TestBed.compileComponents();
    fixture = TestBed.createComponent(TestApp);
    testAppComponent = fixture.debugElement.componentInstance;
    radioButton = fixture.debugElement.query(By.css("input[type=radio]")).nativeElement;
  }));

  it("should not check radio when selected is false", () => {
    testAppComponent.selected = false;
    fixture.detectChanges();

    expect(radioButton.checked).toBe(false);
  });

  it("should check radio when selected is true", () => {
    testAppComponent.selected = true;
    fixture.detectChanges();

    expect(radioButton.checked).toBe(true);
  });
});

@Component({
  selector: "test-app",
  template: `<bit-button-group-element [selected]="selected">Element</bit-button-group-element>`,
})
class TestApp {
  selected = false;
}
