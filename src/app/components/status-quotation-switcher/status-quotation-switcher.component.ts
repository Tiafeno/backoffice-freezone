import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import * as _ from 'lodash';
import { ApiWoocommerceService } from '../../_services/api-woocommerce.service';
import { Helpers } from '../../helpers';
declare var $: any;

@Component({
  selector: 'app-status-quotation-switcher',
  templateUrl: './status-quotation-switcher.component.html',
  styleUrls: ['./status-quotation-switcher.component.css']
})
export class StatusQuotationSwitcherComponent implements OnInit {
  public Form: FormGroup;
  public _quotation: any = '';
  private WC: any;
  public warning: boolean = false;
  public positions: Array<{ key: number, value: string }> = [
    { key: 0, value: 'En attente' },
    { key: 4, value: 'Terminée' },
  ];

  @Input()
  set quotation(order: any) {
    this._quotation = _.clone(order);
    if (_.isObjectLike(order)) {
      $('#quotation-switcher-modal').modal('show');
      const statusValue: any = _.includes([1, 2, 3], order.position) ? '' : parseInt(order.position, 10);
      this.Form.patchValue({ status: statusValue });
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

  ngOnInit() { }

  onUpdate(): void | boolean {
    if (this.Form.invalid || !this.Form.dirty || _.isEmpty(this._quotation)) {
      this.warning = true;
      return false;
    }
    this.warning = false;
    let Value: any = this.Form.value;
    Helpers.setLoading(true);
    this.WC.put(`orders/${this._quotation.id}`, { position: Value.status }, (err, data, res) => {
      Helpers.setLoading(false);
      $('#quotation-switcher-modal').modal('hide');
      document.location.reload();
    });
  }

}
