import { Component, AfterViewInit } from '@angular/core';
import { AuthorizationService } from '../../_services/authorization.service';
import { Router } from '@angular/router';

@Component({
  selector: '[app-header]',
  templateUrl: './app-header.component.html',
})
export class AppHeader implements AfterViewInit {

  constructor(
    private auth: AuthorizationService,
    private router: Router
  ) { }

  ngAfterViewInit()  {
  }
  
  logout(): void {
    if (this.auth.logout()) {
      this.router.navigate(['login']);
    }
  }

}
