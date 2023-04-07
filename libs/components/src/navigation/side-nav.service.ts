import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class SideNavService {
  /**
   * TODO: change inital value to media query
   */
  private _expanded$ = new BehaviorSubject(true);
  expanded$ = this._expanded$.asObservable();

  setExpanded(bool: boolean) {
    this._expanded$.next(bool);
  }

  toggleExpanded() {
    this._expanded$.next(!this._expanded$.getValue());
  }

  isExpanded() {
    return this._expanded$.getValue();
  }
}

/**
 * idea:
 *
 * use bit-menu with drop down nav groups when minimized
 */
