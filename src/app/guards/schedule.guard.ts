import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { AuthorizationService } from '../_services/authorization.service';
import * as moment from 'moment';
import * as _ from 'lodash';
import { Helpers } from '../helpers';
import Swal, { SweetAlertType } from 'sweetalert2';

@Injectable()
export class ScheduleGuard implements CanActivate {
  public dates: Array<any> = [
    { start: '08:00:00', end: '12:15:00' },
    { start: '13:30:00', end: '17:50:00' }
  ];
  public days: Array<string> = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  constructor(private auth: AuthorizationService, private router: Router) {}
  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    const role = this.auth.getCurrentUserRole();
    if (role !== 'administrator') {
      for (let date of this.dates) {
        const dateStart = moment(date.start, 'HH:mm:ss');
        const dateEnd = moment(date.end, 'HH:mm:ss');
        const isIn = moment().isBetween(dateStart, dateEnd, null, '[]'); 
        if (!isIn) {
          // Heure creuse
          this.auth.logout();
          this.errorMessage("Vous ne pouvez pas vous connecter à cette heure", "warning", "Avertissement");
          //this.router.navigate(['login']);
          return false;
        }
      }
      
      let currentDay = moment().format('ddd');
      const isIn: number = _.indexOf(this.days, currentDay);
      if (isIn >= 0 && (currentDay === 'Sat' || currentDay === 'Sun')) {
          // Heure creuse
          this.auth.logout();
          //this.router.navigate(['login']);
          this.errorMessage("Vous ne pouvez pas vous connecter à ce jour", 'error', 'Désolé');
          return false;
      }
    }
    
    return true;
  }

  public errorMessage(message: string, type: SweetAlertType = 'success', title: string = '') {
    Helpers.setLoading(false); // Au cas ou!
    Swal.fire(title, message, type);
  }
}
