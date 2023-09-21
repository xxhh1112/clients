import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";

import { Utils } from "@bitwarden/common/platform/misc/utils";

import { RouterService } from "../router.service";

/**
 * Guard to track deep-linking after a user successfully logs into the vault.
 * @returns If there is no deep link URL present in state returns true, else navigates to deep link
 */
export function postLoginDeepLinkRedirectGuard(): CanActivateFn {
  return async () => {
    const router = inject(Router);
    const routerService = inject(RouterService);

    const persistedPreLoginUrl = await routerService.getAndClearPersistedPreLoginDeepLinkUrl();
    if (!Utils.isNullOrEmpty(persistedPreLoginUrl)) {
      return router.navigateByUrl(persistedPreLoginUrl);
    }

    return true;
  };
}
