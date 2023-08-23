import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class SidebarService {
  private _isSmallScreen = window.matchMedia("(max-width: 768px)").matches;
  private _open$ = new BehaviorSubject<boolean>(!this._isSmallScreen);
  open$ = this._open$.asObservable();

  get open() {
    return this._open$.getValue();
  }

  setOpen() {
    this._open$.next(true);
  }

  setClose() {
    this._open$.next(false);
  }

  toggle() {
    const curr = this._open$.getValue();
    if (curr) {
      this.setClose();
    } else {
      this.setOpen();
    }
  }
}
