import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import * as _ from 'lodash';
import { ApiWoocommerceService } from '../../_services/api-woocommerce.service';
declare var $:any;

@Component({
  selector: 'app-status-quotation-switcher',
  templateUrl: './status-quotation-switcher.component.html',
  styleUrls: ['./status-quotation-switcher.component.css']
})
export class StatusQuotationSwitcherComponent implements OnInit {
  public Form: FormGroup;
  public _quotation: any = '';
  private WC: any;
  public loading: boolean = false;
  public warning: boolean = false;

  @Input() 
  set quotation(val: any) {
    this._quotation = _.clone(val);
    if (_.isObject(val)) {
      $('#quotation-switcher-modal').modal('show');
      this.Form.patchValue({ status: parseInt(val.position) });
    }
    this.cd.detectChanges();
  }

  get quotation(): any { return this._quotation; }

  constructor(
    private apiWC: ApiWoocommerceService,
    private cd: ChangeDetectorRef
  ) {
    this.WC = this.apiWC.getWoocommerce();
    this.Form = new FormGroup({
      status: new FormControl('', Validators.required)
    });
   }

  ngOnInit() {
    
  }

  onUpdate(): void | boolean {
    if (this.Form.invalid || !this.Form.dirty || _.isEmpty(this._quotation))  { 
      this.warning = true;
      return false;
    }
    this.warning = false;
    let Value: any = this.Form.value;
    this.loading = true;
    this.WC.put(`orders/${this._quotation.id}`, {position: Value.status}, (err, data, res) => {
      this.loading = false;
      $('#quotation-switcher-modal').modal('hide');
    })
  }

}
