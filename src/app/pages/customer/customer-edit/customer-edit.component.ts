import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';
import * as _ from 'lodash';
import { Helpers } from '../../../helpers';

@Component({
  selector: 'app-customer-edit',
  templateUrl: './customer-edit.component.html',
  styleUrls: ['./customer-edit.component.css']
})
export class CustomerEditComponent implements OnInit, OnChanges {
  public ID: number = 0;
  public hasAddress: boolean = false;
  public Client: any = {};
  private Woocommerce: any;
  @Input() customer;
  constructor(
    private route: ActivatedRoute,
    private apiWC: ApiWoocommerceService
  ) {
    this.Woocommerce = this.apiWC.getWoocommerce();
   }

  ngOnInit() {
    this.route.parent.params.subscribe(params => {
      if (_.isUndefined(params.id)) return false;
      this.ID = params.id;
      this.initCustomer();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.customer.currentValue && changes.customer.currentValue !== 0) {
      this.ID = changes.customer.currentValue;
      this.initCustomer();
    }
  }

  private initCustomer() {
    Helpers.setLoading(true);
    this.Woocommerce.get(`customers/${this.ID}?context=edit`, (err, data, res) => {
      let response: any = JSON.parse(res);
      this.Client = _.clone(response);
      if ( ! _.isEmpty(this.Client.billing.email) ) {
        this.hasAddress = true;
      }
      Helpers.setLoading(false);
    });
  }

}
