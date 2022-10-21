import { Injectable, OnDestroy } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { BehaviorSubject, Observable, Subject, takeUntil } from "rxjs";

import { CipherView } from "@bitwarden/common/models/view/cipher.view";

export abstract class CipherProviderService {
  ciphers$: Observable<CipherView[]>;
}

@Injectable()
export class PersonalVaultCipherProviderService implements CipherProviderService, OnDestroy {
  private onDestroy = new Subject<void>();
  private _ciphers$ = new BehaviorSubject<CipherView[]>([]);

  ciphers$ = this._ciphers$.asObservable();

  constructor(private activatedRoute: ActivatedRoute) {
    this.activatedRoute.queryParamMap.pipe(takeUntil(this.onDestroy)).subscribe((v) => {
      // eslint-disable-next-line no-console
      console.log("PersonalVaultCipherProviderService.activatedRoute.queryParamMap", v);
    });
  }

  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }
}
