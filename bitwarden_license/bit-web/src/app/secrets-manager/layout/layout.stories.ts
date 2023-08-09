import { Component, importProvidersFrom } from "@angular/core";
import { RouterModule } from "@angular/router";
import {
  Meta,
  Story,
  applicationConfig,
  componentWrapperDecorator,
  moduleMetadata,
} from "@storybook/angular";
import { BehaviorSubject } from "rxjs";

import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { IconModule } from "@bitwarden/components";
import { PreloadedEnglishI18nModule } from "@bitwarden/web-vault/app/core/tests";

import { LayoutComponent } from "./layout.component";
import { LayoutModule } from "./layout.module";
import { NavigationComponent } from "./navigation.component";

class MockOrganizationService implements Partial<OrganizationService> {
  private static _orgs = new BehaviorSubject<Organization[]>([]);
  organizations$ = MockOrganizationService._orgs; // eslint-disable-line rxjs/no-exposed-subjects
}

@Component({
  selector: "story-content",
  template: ` <p class="tw-text-main">Content</p> `,
})
class StoryContentComponent {}

export default {
  title: "Web/Layout",
  component: LayoutComponent,
  decorators: [
    componentWrapperDecorator(
      /**
       * Applying a CSS transform makes a `position: fixed` element act like it is `position: relative`
       * https://github.com/storybookjs/storybook/issues/8011#issue-490251969
       */
      (story) => `<div class="tw-scale-100">${story}</div>`
    ),
    moduleMetadata({
      imports: [RouterModule, LayoutModule, IconModule],
      declarations: [StoryContentComponent],
      providers: [{ provide: OrganizationService, useClass: MockOrganizationService }],
    }),
    applicationConfig({
      providers: [
        importProvidersFrom(
          RouterModule.forRoot(
            [
              {
                path: "",
                component: LayoutComponent,
                children: [
                  {
                    path: "",
                    redirectTo: "secrets",
                    pathMatch: "full",
                  },
                  {
                    path: "secrets",
                    component: StoryContentComponent,
                    data: {
                      title: "secrets",
                      searchTitle: "searchSecrets",
                    },
                  },
                  {
                    outlet: "sidebar",
                    path: "",
                    component: NavigationComponent,
                  },
                ],
              },
            ],
            { useHash: true }
          )
        ),
        importProvidersFrom(PreloadedEnglishI18nModule),
      ],
    }),
  ],
} as Meta;

const Template: Story = (args) => ({
  props: args,
  template: `
    <router-outlet></router-outlet>
  `,
});

export const Default = Template.bind({});
