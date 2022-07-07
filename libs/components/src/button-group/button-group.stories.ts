import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Meta, moduleMetadata, Story } from "@storybook/angular";

import { BadgeModule } from "../badge";

import { ButtonGroupElementComponent } from "./button-group-element.component";
import { ButtonGroupComponent } from "./button-group.component";

export default {
  title: "Component Library/Button Group",
  component: ButtonGroupComponent,
  args: {
    selected: "left",
  },
  decorators: [
    moduleMetadata({
      declarations: [ButtonGroupComponent, ButtonGroupElementComponent],
      imports: [FormsModule, ReactiveFormsModule, BadgeModule],
    }),
  ],
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/Zt3YSeb6E6lebAffrNLa0h/Tailwind-Component-Library?node-id=1881%3A17157",
    },
  },
} as Meta;

const Template: Story<ButtonGroupComponent> = (args: ButtonGroupComponent) => ({
  props: {
    form: new FormGroup({
      position: new FormControl("left"),
    }),
    ...args,
  },
  template: `
    <h3 class="tw-text-main">Template-driven forms (ngModel)</h3>
    <p>
      <bit-button-group [(ngModel)]="selected" label="Example with 3 grouped buttons">
        <bit-button-group-element value="left">
          Left <span bitBadge badgeType="info">1</span>
        </bit-button-group-element>
        <bit-button-group-element value="center">
          Center
        </bit-button-group-element>
        <bit-button-group-element value="right">
          Right
        </bit-button-group-element>
      </bit-button-group>
    </p>
    <h3 class="tw-text-main">Reactive forms (form control)</h3>
    <form [formGroup]="form">
      <bit-button-group formControlName="position" label="Example with 3 grouped buttons">
        <bit-button-group-element value="left">
          Left <span bitBadge badgeType="info">1</span>
        </bit-button-group-element>
        <bit-button-group-element value="center">
          Center
        </bit-button-group-element>
        <bit-button-group-element value="right">
          Right
        </bit-button-group-element>
      </bit-button-group>
    </form>
  `,
});

export const Default = Template.bind({});
Default.args = {
  selected: "left",
};
