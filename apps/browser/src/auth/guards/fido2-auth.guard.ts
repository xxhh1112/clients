import { inject } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from "@angular/router";

import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import { BrowserRouterService } from "../../platform/popup/services/browser-router.service";

export const fido2AuthGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const routerService = inject(BrowserRouterService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const authStatus = await authService.getAuthStatus();

  if (authStatus === AuthenticationStatus.LoggedOut) {
    routerService.setPreviousUrl(state.url);
    return router.createUrlTree(["/home"], { queryParams: route.queryParams });
  }

  if (authStatus === AuthenticationStatus.Locked) {
    routerService.setPreviousUrl(state.url);
    return router.createUrlTree(["/lock"], { queryParams: route.queryParams });
  }

  return true;
};
