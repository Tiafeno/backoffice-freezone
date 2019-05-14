import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Helpers } from '../../helpers';
import * as _ from 'lodash';
import { ApiWordpressService } from '../../_services/api-wordpress.service';
import Swal from 'sweetalert2';
declare var $:any;

@Component({
  selector: 'app-new-customer',
  templateUrl: './new-customer.component.html',
  styleUrls: ['./new-customer.component.css']
})
export class NewCustomerComponent implements OnInit, AfterViewInit {
  public WPAPI: any;
  public users: any[];
  public customer: any = 0;
  constructor(
    private apiWordpress: ApiWordpressService
  ) {
    this.WPAPI = apiWordpress.getWPAPI();
   }

  ngOnInit() {
    $('#customer-edit-modal').on('hide.bs.modal', e => {
      this.customer = 0;
    });
  }

  ngAfterViewInit() {
    Helpers.setLoading(true);
    this.WPAPI.users().roles('fz-particular').context('edit').then(resp => {
      if (_.isArray(resp)) {
        this.users = _.clone(resp);
      }
      Helpers.setLoading(false);
    }).catch(err => {
      Helpers.setLoading(false);
      Swal.fire("Désolé", err.message, 'error');
    });
  }

  onView(customerId: number) {
    this.customer = customerId;
    $('#customer-edit-modal').modal('show');
  }

}
