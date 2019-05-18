import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { AuthorizationService } from '../_services/authorization.service';

@Injectable()
export class LoginGuard implements CanActivate {
  constructor(
    private authorization: AuthorizationService,
    private router: Router
  ) {}
  canActivate(): boolean {
    if ( ! this.authorization.isLogged()) {
      return true;
    } else {
      this.router.navigate(['index']);
      return false;
    }
  }
}
