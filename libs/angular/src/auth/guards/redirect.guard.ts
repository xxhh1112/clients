import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";

import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

export interface RedirectRoutes {
  home: string;
  login: string;
  lock: string;
}

const defaultRoutes: RedirectRoutes = {
  home: "/vault",
  login: "/login",
  lock: "/lock",
};

/**
 * Guard that consolidates all redirection logic, should be applied to root route.
 */
export function redirectGuard(overrides: Partial<RedirectRoutes> = {}): CanActivateFn {
  const routes = { ...defaultRoutes, ...overrides };
  return async (route) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const authStatus = await authService.getAuthStatus();

    if (authStatus === AuthenticationStatus.LoggedOut) {
      return router.createUrlTree([routes.login], { queryParams: route.queryParams });
    }

    if (authStatus === AuthenticationStatus.Unlocked) {
      return router.createUrlTree([routes.home], { queryParams: route.queryParams });
    }

    if (authStatus === AuthenticationStatus.Locked) {
      return router.createUrlTree([routes.lock], { queryParams: route.queryParams });
    }

    return router.createUrlTree(["/"]);
  };
}
