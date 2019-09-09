import { Component, OnInit, ViewEncapsulation, ViewChild, ChangeDetectorRef } from '@angular/core';
import * as _ from 'lodash';
import { StatusQuotationSwitcherComponent } from '../../../components/status-quotation-switcher/status-quotation-switcher.component';
import { QuotationCustomComponent } from '../quotation-custom/quotation-custom.component';
declare var $: any;

@Component({
  selector: 'app-quotation--datatable',
  templateUrl: './quotation--datatable.component.html',
  styleUrls: ['./quotation--datatable.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class QuotationDatatableComponent implements OnInit {
  public qtSelected: any = null;

  @ViewChild(StatusQuotationSwitcherComponent) QuotationSwitcher: StatusQuotationSwitcherComponent;
  @ViewChild(QuotationCustomComponent) QuotationCustom: QuotationCustomComponent;

  constructor(
    private cd: ChangeDetectorRef
  ) { }

  /**
   * Cette fonction permet de selectionner une demande
   * @param order 
   */
  public setQtSelected(order: any) {
    this.qtSelected = _.clone(order);
    this.cd.markForCheck();
  }

  ngOnInit() {

  }

}
