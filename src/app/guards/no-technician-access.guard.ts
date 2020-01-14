import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { AuthorizationService } from '../_services/authorization.service';
import * as _ from 'lodash';
import { Helpers } from '../helpers';
import Swal from 'sweetalert2';

@Injectable()
export class NoTechnicianAccessGuard implements CanActivate {
  constructor( private auth: AuthorizationService) {}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
      let currentUser: any = this.auth.getCurrentUser();
      let inArray: Array<any> = _.filter(currentUser.data.roles, role => role === 'author');
      if (_.isEmpty(inArray)) return true;
      Helpers.setLoading(false);
      Swal.fire('Désolé', "Accès non-autorisé", 'warning');
      return false;
  }
}
