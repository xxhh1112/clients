import {
  AfterContentInit,
  Component,
  ContentChildren,
  Input,
  QueryList,
  TemplateRef,
} from "@angular/core";

import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";

import { I18nTagDirective } from "./i18n-tag.directive";

interface I18nStringPart {
  text: string;
  tagId?: number;
  templateRef?: TemplateRef<any>;
}

/**
 * Component that renders a translated string with optional templateRefs for each tag identifier in the translated string.
 *
 * The translated string must be in the following format:
 *
 * `"This will be a <0>translated link</0> and this will be another <1>translated link</1>."`
 *
 * The tag identifiers must be numbers surrounded by angle brackets and will be used to match the corresponding
 * bit-i18n-tag. If there are not enough bit-i18n-tag directives, the text will be rendered as-is for the remaining
 * tags.
 *
 * @example
 * <div bit-i18n key="exampleI18nKey">
 *  <a *bit-i18n-tag="let text" routerLink="./first-link">{{ text }}</a>
 *  <a *bit-i18n-tag="let text" routerLink="./bold-link">
 *    <strong>{{ text }}</strong>
 *  </a>
 * </div>
 */
@Component({
  selector: "[bit-i18n],bit-i18n",
  template: `
    <ng-container *ngFor="let part of translationParts">
      <ng-container *ngIf="part.templateRef != undefined; else text">
        <ng-container
          *ngTemplateOutlet="part.templateRef; context: { $implicit: part.text }"
        ></ng-container>
      </ng-container>
      <ng-template #text>{{ part.text }}</ng-template>
    </ng-container>
  `,
})
export class I18nComponent implements AfterContentInit {
  @Input("key")
  translationKey: string;

  @ContentChildren(I18nTagDirective)
  templateTags: QueryList<I18nTagDirective>;

  protected translationParts: I18nStringPart[] = [];

  constructor(private i18nService: I18nService) {}

  ngAfterContentInit() {
    this.translationParts = this.parseTranslatedString(this.i18nService.t(this.translationKey));
    // Assign any templateRefs to the translation parts
    this.templateTags.forEach((tag, index) => {
      this.translationParts.forEach((part) => {
        if (part.tagId === index) {
          part.templateRef = tag.templateRef;
        }
      });
    });
  }

  /**
   * Parses a translated string into an array of parts separated by tag identifiers.
   * Tag identifiers must be numbers surrounded by angle brackets.
   * @example
   * parseTranslatedString("Hello <0>World</0>!")
   * // returns [{ text: "Hello " }, { text: "World", tagId: 0 }, { text: "!" }]
   * @param inputString
   * @private
   */
  private parseTranslatedString(inputString: string): I18nStringPart[] {
    const regex = /<(\d+)>(.*?)<\/\1>|([^<]+)/g;
    const parts: I18nStringPart[] = [];
    let match: RegExpMatchArray;

    while ((match = regex.exec(inputString)) !== null) {
      if (match[1]) {
        parts.push({ text: match[2], tagId: parseInt(match[1]) });
      } else {
        parts.push({ text: match[3] });
      }
    }

    return parts;
  }
}
