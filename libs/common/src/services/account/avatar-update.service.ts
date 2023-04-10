import { BehaviorSubject, Observable } from "rxjs";

// import { AccountApiService } from "@bitwarden/common/auth/abstractions/account-api.service";

import { AvatarUpdateService as AvatarUpdateServiceAbstraction } from "../../abstractions/account/avatar-update.service";
import { StateService } from "../../abstractions/state.service";
import { AccountApiService } from "../../auth/abstractions/account-api.service";
import { UpdateAvatarRequest } from "../../models/request/update-avatar.request";
import { ProfileResponse } from "../../models/response/profile.response";

export class AvatarUpdateService implements AvatarUpdateServiceAbstraction {
  private _avatarUpdate$ = new BehaviorSubject<string | null>(null);
  avatarUpdate$: Observable<string | null> = this._avatarUpdate$.asObservable();

  constructor(private accountApiService: AccountApiService, private stateService: StateService) {
    this.loadColorFromState();
  }

  loadColorFromState(): Promise<string | null> {
    return this.stateService.getAvatarColor().then((color) => {
      this._avatarUpdate$.next(color);
      return color;
    });
  }

  pushUpdate(color: string | null): Promise<ProfileResponse | void> {
    return this.accountApiService.putAvatar(new UpdateAvatarRequest(color)).then((response) => {
      this.stateService.setAvatarColor(response.avatarColor);
      this._avatarUpdate$.next(response.avatarColor);
    });
  }
}
