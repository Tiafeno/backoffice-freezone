import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { AuthorizationService } from '../_services/authorization.service';
import * as moment from 'moment';
import * as _ from 'lodash';

@Injectable()
export class ScheduleGuard implements CanActivate {
  public dates: Array<any> = [
    { start: '08:00:00', end: '12:00:00' },
    { start: '14:00:00', end: '17:30:00' }
  ];
  public days: Array<string> = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  constructor(private auth: AuthorizationService, private router: Router) {}
  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    const role = this.auth.getCurrentUserRole();
    if (role !== 'administrator') {
      for (let date of this.dates) {
        const dateStart = moment(date.start, 'HH:mm:ss');
        const dateEnd = moment(date.end, 'HH:mm:ss');
        const isIn = moment().isBetween(dateStart, dateEnd, 'hours'); 
        if (!isIn) {
          // Heure creuse
          return false;
        }
      }
      
      let currentDay = moment().format('ddd');
      const isIn: number = _.indexOf(this.days, currentDay);
      if (isIn >= 0 && (currentDay === 'Sat' || currentDay === 'Sun')) {
          // Heure creuse
          return false;
      }
    }
    
    return true;
  }
}
