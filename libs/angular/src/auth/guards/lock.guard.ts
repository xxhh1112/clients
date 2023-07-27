import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";

import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

/**
 * Only allow access to this route if the vault is locked.
 * Otherwise redirect to root.
 */
export function lockGuard(): CanActivateFn {
  return async () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const authStatus = await authService.getAuthStatus();
    if (authStatus !== AuthenticationStatus.Locked) {
      return router.createUrlTree(["/"]);
    }
    return true;
  };
}
