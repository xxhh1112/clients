import { Component } from "@angular/core";
import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { By } from "@angular/platform-browser";

import { ButtonGroupElementComponent } from "./button-group-element.component";
import { ButtonGroupModule } from "./button-group.module";

describe("Button", () => {
  let fixture: ComponentFixture<TestApp>;
  let testAppComponent: TestApp;
  let buttonElements: ButtonGroupElementComponent[];
  let radioButtons: HTMLInputElement[];

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ButtonGroupModule],
      declarations: [TestApp],
    });

    TestBed.compileComponents();
    fixture = TestBed.createComponent(TestApp);
    testAppComponent = fixture.debugElement.componentInstance;
    buttonElements = fixture.debugElement
      .queryAll(By.css("bit-button-group-element"))
      .map((e) => e.componentInstance);
    radioButtons = fixture.debugElement
      .queryAll(By.css("input[type=radio]"))
      .map((e) => e.nativeElement);

    fixture.detectChanges();
  }));

  it("should select second element when setting selected to second", () => {
    testAppComponent.selected = "second";
    fixture.detectChanges();

    expect(buttonElements[1].selected).toBe(true);
  });

  it("should not select second element when setting selected to third", () => {
    testAppComponent.selected = "third";
    fixture.detectChanges();

    expect(buttonElements[1].selected).toBe(false);
  });

  it("should emit new value when changing selection by clicking on radio button", () => {
    testAppComponent.selected = "first";
    fixture.detectChanges();

    radioButtons[1].click();

    expect(testAppComponent.selected).toBe("second");
  });
});

@Component({
  selector: "test-app",
  template: `
    <bit-button-group [(selected)]="selected">
      <bit-button-group-element value="first">First</bit-button-group-element>
      <bit-button-group-element value="second">Second</bit-button-group-element>
      <bit-button-group-element value="third">Third</bit-button-group-element>
    </bit-button-group>
  `,
})
class TestApp {
  selected?: string;
}
