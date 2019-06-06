import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthorizationService } from '../_services/authorization.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authorization: AuthorizationService, private router: Router) {}
  canActivate(): boolean {
    if ( ! this.authorization.isLogged()) {
      this.router.navigate(['login']);
      return false;
    } else {
      return true;
    }
  }
}
