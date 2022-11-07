// import { Component } from "@angular/core";
// import { FormsModule } from "@angular/forms";
// import { RouterModule } from "@angular/router";
// import { Meta, moduleMetadata, Story } from "@storybook/angular";

// import { I18nService } from "@bitwarden/common/abstractions/i18n.service";

// import { ButtonModule } from "../../button";
// import { TabsModule } from "../../tabs";
// import { I18nMockService } from "../../utils/i18n-mock.service";
// import { DialogModule } from "../dialog.module";

// @Component({
//   selector: "app-main-content",
//   template: `
//     <input [(ngModel)]="data" class="tw-mr-2" />
//     <a [routerLink]="link" bitButton buttonType="primary">Open dialog</a>
//   `,
// })
// class MainContentComponent {
//   data = "Some data";

//   link = [
//     "/",
//     {
//       outlets: {
//         dialog: ["example"],
//       },
//     },
//   ];
// }

// @Component({
//   selector: "app-example-dialog",
//   template: ` <bit-dialog [dialogSize]="dialogSize" [disablePadding]="disablePadding">
//     <span bitDialogTitle>Title</span>
//     <span bitDialogContent>Dialog body text goes here.</span>
//     <div bitDialogFooter class="tw-flex tw-flex-row tw-items-center tw-gap-2">
//       <button bitButton buttonType="primary">Save</button>
//       <button bitButton buttonType="secondary">Cancel</button>
//     </div>
//   </bit-dialog>`,
// })
// class ExampleDialogComponent {}

// export default {
//   title: "Component Library/Dialogs/Routeable Dialog",
//   decorators: [
//     moduleMetadata({
//       providers: [
//         {
//           provide: I18nService,
//           useFactory: () => {
//             return new I18nMockService({
//               close: "Close",
//             });
//           },
//         },
//       ],
//       declarations: [MainContentComponent, ExampleDialogComponent],
//       imports: [
//         ButtonModule,
//         DialogModule,
//         TabsModule,
//         FormsModule,
//         RouterModule.forRoot(
//           [
//             { path: "", component: MainContentComponent },
//             { path: "example", outlet: "dialog", component: ExampleDialogComponent },
//           ],
//           { useHash: true }
//         ),
//       ],
//     }),
//   ],
//   args: {
//     dialogSize: "small",
//   },
//   argTypes: {
//     _disablePadding: {
//       table: {
//         disable: true,
//       },
//     },
//   },
//   parameters: {
//     design: {
//       type: "figma",
//       url: "https://www.figma.com/file/Zt3YSeb6E6lebAffrNLa0h/Tailwind-Component-Library",
//     },
//   },
// } as Meta;

// const Template: Story = (args) => ({
//   props: args,
//   template: `
//     <bit-routeable-dialog-outlet></bit-routeable-dialog-outlet>
//     <router-outlet></router-outlet>`,
// });

// export const Default = Template.bind({});
// Default.args = {
//   dialogSize: "default",
//   title: "Default",
// };
