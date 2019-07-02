import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import * as _ from 'lodash';
import { AuthorizationService } from '../_services/authorization.service';
import { Helpers } from '../helpers';
import Swal from 'sweetalert2';

@Injectable()
export class NoCommercialAccessGuard implements CanActivate {
  constructor(
    private authorization: AuthorizationService
  ) {}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): boolean {

      let currentUser: any = this.authorization.getCurrentUser();
      let inArray: Array<any> = _.filter(currentUser.data.roles, role => role === 'editor');
      if (_.isEmpty(inArray)) return true;
      Helpers.setLoading(false);
      Swal.fire('Désolé', "Accès non-autorisé", 'warning');
      return false;
  }
}
