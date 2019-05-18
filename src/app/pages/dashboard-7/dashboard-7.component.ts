import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { ScriptLoaderService } from '../../_services/script-loader.service';
import { HttpClient } from '@angular/common/http';
import { AuthorizationService } from '../../_services/authorization.service';
import { NewCustomerComponent } from '../../components/new-customer/new-customer.component';

@Component({
  selector: 'app-dashboard-7',
  templateUrl: './dashboard-7.component.html',
})
export class Dashboard7Component implements OnInit, AfterViewInit {

  @ViewChild(NewCustomerComponent) newCustomer: NewCustomerComponent;
  constructor(
    private _script: ScriptLoaderService
  ) { }

  ngOnInit() {
    
  }

  ngAfterViewInit() {
    this._script.load('./assets/js/scripts/dashboard_7.js');
  }

}
