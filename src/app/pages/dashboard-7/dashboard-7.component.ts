import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { ScriptLoaderService } from '../../_services/script-loader.service';
import { NewCustomerComponent } from '../../components/new-customer/new-customer.component';
import { AcceptedItemSuppliersComponent } from '../../components/accepted-item-suppliers/accepted-item-suppliers.component';

@Component({
  selector: 'app-dashboard-7',
  templateUrl: './dashboard-7.component.html',
})
export class Dashboard7Component implements OnInit, AfterViewInit {

  @ViewChild(NewCustomerComponent) newCustomer: NewCustomerComponent;
  @ViewChild(AcceptedItemSuppliersComponent) acceptedItemSuppliers: AcceptedItemSuppliersComponent;

  constructor(
    private _script: ScriptLoaderService
  ) { }

  ngOnInit() {
    
  }

  ngAfterViewInit() {
    this._script.load('./assets/js/scripts/dashboard_7.js');
  }

}
