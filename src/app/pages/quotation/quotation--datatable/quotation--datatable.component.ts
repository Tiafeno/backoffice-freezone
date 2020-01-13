import { Component, OnInit, ViewEncapsulation, ViewChild, ChangeDetectorRef } from '@angular/core';
import * as _ from 'lodash';
import { StatusQuotationSwitcherComponent } from '../../../components/status-quotation-switcher/status-quotation-switcher.component';
import { QuotationCustomComponent } from '../quotation-custom/quotation-custom.component';
import * as moment from 'moment';
import { FilterSearchArticleComponent } from '../../../components/filter-search-article/filter-search-article.component';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';
import { Helpers } from '../../../helpers';
declare var $: any;

@Component({
  selector: 'app-quotation--datatable',
  templateUrl: './quotation--datatable.component.html',
  styleUrls: ['./quotation--datatable.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class QuotationDatatableComponent implements OnInit {
  private woocommerce: any;
  public qtSelected: any = null;
  public queryResults:Array<any> = [];
  public refreshQuotatuon: any = '';

  @ViewChild(StatusQuotationSwitcherComponent) QuotationSwitcher: StatusQuotationSwitcherComponent;
  @ViewChild(QuotationCustomComponent) QuotationCustom: QuotationCustomComponent;
  @ViewChild(FilterSearchArticleComponent) FilterWord: FilterSearchArticleComponent;

  constructor(
    private cd: ChangeDetectorRef,
    private apiWC: ApiWoocommerceService
  ) { 
    this.woocommerce = this.apiWC.getWoocommerce();
  }

  /**
   * Cette fonction permet de selectionner une demande
   * @param order 
   */
  public setQtSelected(order: any) {
    this.qtSelected = _.clone(order);
    this.refreshQuotatuon = moment().format('YYYY-MM-DD HH:mm:ss');
    this.cd.detectChanges();
  }

  // Cette fonction se declanche pour effectuer les recherches
  public onSearchWord(ev:{word?: string}) {
    const find = ev.word;
    Helpers.setLoading(true);
    this.woocommerce.get(`orders?search=${find}&context=edit`, (err, data, res) => {
      //console.log(data.toJSON());
      const response = JSON.parse(res);
      this.queryResults = _.clone(response);
      Helpers.setLoading(false);
      this.cd.detectChanges();
    });
  }

  ngOnInit() {

  }

}
