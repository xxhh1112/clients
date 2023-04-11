import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class LayoutService {
  private _open$ = new BehaviorSubject(!window.matchMedia(`(max-width: 768px)`).matches);
  open$ = this._open$.asObservable();

  toggleExpanded() {
    this._open$.next(!this._open$.getValue());
  }

  isExpanded() {
    return this._open$.getValue();
  }
}
