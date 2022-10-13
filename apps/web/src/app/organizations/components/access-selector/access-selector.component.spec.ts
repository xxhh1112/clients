import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import {
  AvatarModule,
  BadgeModule,
  ButtonModule,
  FormFieldModule,
  IconButtonModule,
  TableModule,
  TabsModule,
} from "@bitwarden/components";
import { SelectItemView } from "@bitwarden/components/src/multi-select/models/select-item-view";

import { PreloadedEnglishI18nModule } from "../../../tests/preloaded-english-i18n.module";

import { AccessSelectorComponent } from "./access-selector.component";
import { AccessItemType, CollectionPermission } from "./access-selector.models";
import { UserTypePipe } from "./user-type.pipe";

/**
 * Helper class that makes it easier to test the AccessSelectorComponent by
 * exposing some protected methods/properties
 */
class TestableAccessSelectorComponent extends AccessSelectorComponent {
  selectItems(items: SelectItemView[]) {
    super.selectItems(items);
  }
  deselectItem(id: string) {
    this.selectionList.deselectItem(id);
  }

  /**
   * Helper used to simulate a user selecting a new permission for a table row
   * @param index - "Row" index
   * @param perm - The new permission value
   */
  changeSelectedItemPerm(index: number, perm: CollectionPermission) {
    this.selectionList.formArray.at(index).patchValue({
      permission: perm,
    });
  }
}

describe("AccessSelectorComponent", () => {
  let component: TestableAccessSelectorComponent;
  let fixture: ComponentFixture<TestableAccessSelectorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ButtonModule,
        FormFieldModule,
        AvatarModule,
        BadgeModule,
        ReactiveFormsModule,
        FormsModule,
        TabsModule,
        TableModule,
        PreloadedEnglishI18nModule,
        JslibModule,
        IconButtonModule,
      ],
      declarations: [TestableAccessSelectorComponent, UserTypePipe],
      providers: [],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestableAccessSelectorComponent);
    component = fixture.componentInstance;

    component.emptySelectionText = "Nothing selected";

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("itemSelection", () => {
    beforeEach(() => {
      component.items = [
        {
          id: "123",
          type: AccessItemType.GROUP,
          labelName: "Group 1",
          listName: "Group 1",
        },
      ];
      fixture.detectChanges();
    });

    it("should have no items selected initially", () => {
      const emptyTableCell = fixture.nativeElement.querySelector("tbody tr td");
      expect(emptyTableCell?.textContent).toEqual("Nothing selected");
    });

    it("should show one selected value", () => {
      component.selectItems([{ id: "123" } as any]);
      fixture.detectChanges();
      const firstColSpan = fixture.nativeElement.querySelector("tbody tr td span");
      expect(firstColSpan.textContent).toEqual("Group 1");
    });

    it("should emit when the internal value changes", () => {
      const mockChange = jest.fn();
      let expectedCalls = 0;
      component.registerOnChange(mockChange);
      component.permissionMode = "edit";

      // Simulate selecting an item
      component.selectItems([{ id: "123" } as any]);
      expectedCalls++;

      expect(mockChange.mock.calls.length).toEqual(expectedCalls);
      expect(mockChange.mock.lastCall[0]).toHaveProperty("[0].id", "123");

      // Simulate modifying that item
      component.changeSelectedItemPerm(0, CollectionPermission.EDIT);
      expectedCalls++;

      expect(mockChange.mock.calls.length).toEqual(expectedCalls);
      expect(mockChange.mock.lastCall[0]).toHaveProperty("[0].id", "123");
      expect(mockChange.mock.lastCall[0]).toHaveProperty(
        "[0].permission",
        CollectionPermission.EDIT
      );

      // Simulate deselecting that item
      component.deselectItem("123");
      expectedCalls++;

      expect(mockChange.mock.calls.length).toEqual(expectedCalls);
      expect(mockChange.mock.lastCall[0].length).toEqual(0);
    });
  });
});
