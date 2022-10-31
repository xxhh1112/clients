import { Directive, HostBinding, OnDestroy, OnInit, Optional } from "@angular/core";
import { NavigationEnd, Router, RouterLinkWithHref } from "@angular/router";
import { filter, Subject, takeUntil } from "rxjs";

@Directive({
  selector: "a[bitNavigation]",
})
export class NavigationDirective implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private active = false;

  @HostBinding("class") get classList() {
    return [
      "tw-relative",
      "tw-flex",
      "tw-gap-1",
      "tw-items-center",
      "tw-bg-background-alt3",
      "!tw-text-alt2",
      "tw-font-semibold",
      "tw-py-2",
      "tw-px-4",
      // hover
      "hover:tw-text-alt2",
      "hover:tw-no-underline",
      "[&>:not(.bwi)]:hover:tw-underline",
      // focus
      "focus-visible:tw-outline-none",
      "focus-visible:tw-ring",
      "focus-visible:tw-ring-text-alt2",
      "focus-visible:tw-rounded",
      "focus-visible:tw-z-10",
    ].concat(this.active ? ["tw-bg-background-alt4"] : []);
  }

  constructor(private router: Router, @Optional() private routerLinkWithHref: RouterLinkWithHref) {}

  ngOnInit(): void {
    this.updateActive();

    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.updateActive());
  }

  private updateActive(): void {
    if (this.routerLinkWithHref) {
      this.active = this.router.isActive(this.routerLinkWithHref.urlTree, {
        paths: "exact",
        queryParams: "exact",
        fragment: "ignored",
        matrixParams: "ignored",
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
