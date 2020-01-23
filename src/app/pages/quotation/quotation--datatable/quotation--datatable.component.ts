import { Component, OnInit, ViewEncapsulation, ViewChild, ChangeDetectorRef } from '@angular/core';
import * as _ from 'lodash';
import { StatusQuotationSwitcherComponent } from '../../../components/status-quotation-switcher/status-quotation-switcher.component';
import { QuotationCustomComponent } from '../quotation-custom/quotation-custom.component';
import * as moment from 'moment';
import { FilterSearchArticleComponent } from '../../../components/filter-search-article/filter-search-article.component';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';
import { Helpers } from '../../../helpers';
import { wpOrder } from '../../../order.item';
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
  public queryResults: Array<wpOrder> = [];
  public refreshQuotatuon: any = '';
  public pagination: any;

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
      const pageSize: number = 5;
      const queryResponse = response;
      this.pagination.pagination({
        dataSource: _.range(queryResponse.length),
        totalNumber: queryResponse.length,
        pageNumber: 1,
        pageSize: pageSize,
        showPrevious: true,
        showNext: true,
        ulClassName: 'pagination justify-content-center',
        className: 'page-item',
        activeClassName: 'active',
        afterPageOnClick: (data, pagination) => {
          let currentPage: number = parseInt(pagination, 10);
          let pages: Array<Array<wpOrder>> = _.chunk(queryResponse, pageSize);
          this.queryResults = pages[currentPage];
        },
        afterRender: (data, pagination) => { }
     });

      Helpers.setLoading(false);
      this.cd.detectChanges();
    });
  }

  ngOnInit() {
    this.pagination = $('#pagination');
  }

}
