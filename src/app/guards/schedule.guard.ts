import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { AuthorizationService } from '../_services/authorization.service';
import * as moment from 'moment';

@Injectable()
export class ScheduleGuard implements CanActivate {
  public dates: Array<any> = [
    { start: '08:00:00', end: '12:00:00' },
    { start: '14:00:00', end: '18:00:00' }
  ];
  public days: Array<string> = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  constructor(private auth: AuthorizationService, private router: Router) {
  }
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    let today: string = moment().format('ddd');
    
    return true;
  }
}
