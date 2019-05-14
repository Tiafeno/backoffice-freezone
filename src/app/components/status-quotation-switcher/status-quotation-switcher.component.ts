import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import * as _ from 'lodash';
import { ApiWoocommerceService } from '../../_services/api-woocommerce.service';
declare var $:any;

@Component({
  selector: 'app-status-quotation-switcher',
  templateUrl: './status-quotation-switcher.component.html',
  styleUrls: ['./status-quotation-switcher.component.css']
})
export class StatusQuotationSwitcherComponent implements OnInit, OnChanges {
  public Form: FormGroup;
  public Order: any;
  private WC: any;
  public loading: boolean = false;
  public warning: boolean = false;
  @Input() quotation;

  constructor(
    private apiWC: ApiWoocommerceService
  ) {
    this.Form = new FormGroup({
      status: new FormControl('', Validators.required)
    });
    this.WC = this.apiWC.getWoocommerce();
   }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (_.isObject(changes.quotation.currentValue)) {
      let currentvalue: any = changes.quotation.currentValue;
      this.Order = _.clone(currentvalue);
      this.Form.patchValue({ status: currentvalue.position });
      $('#quotation-switcher-modal').modal('show');
    }
  }

  onUpdate(): void | boolean {
    if (this.Form.invalid || !this.Form.dirty)  { 
      this.warning = true;
      return false;
    }
    this.warning = false;
    let Value: any = this.Form.value;
    this.loading = true;
    this.WC.put(`orders/${this.Order.id}`, {position: Value.status}, (err, data, res) => {
      let response: any = JSON.parse(res);
      this.loading = false;
      $('#quotation-switcher-modal').modal('hide');
    })
  }

}
