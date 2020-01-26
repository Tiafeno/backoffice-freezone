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
  public onSearchWord(ev: { word?: string }) {
    const find = ev.word;
    Helpers.setLoading(true);
    this.woocommerce.get(`orders?search=${find}&context=edit`, (err, data, res) => {
      Helpers.setLoading(false);
      //console.log(data.toJSON());
      const response: Array<wpOrder> = JSON.parse(res);
      if (_.isEmpty(response)) return false;
      const pageSize: number = 5;
      // Retirer tous les commandes sans client
      const queryResponse = _.reject(response, (rs: wpOrder) => rs.customer_id === 0);
      let pages: Array<Array<wpOrder>> = _.chunk(queryResponse, pageSize);
      if (_.isEmpty(pages)) return false;
      this.queryResults = pages[0];
      this.pagination.pagination({
        dataSource: _.range(queryResponse.length),
        totalNumber: queryResponse.length,
        pageNumber: 1,
        pageSize: pageSize,
        showPrevious: false,
        showNext: false,
        ulClassName: 'pagination justify-content-center',
        className: 'page-item',
        activeClassName: 'active',
        afterPageOnClick: (data, pagination) => {
          let currentPage: number = parseInt(pagination, 10);
          let pages: Array<Array<wpOrder>> = _.chunk(queryResponse, pageSize);
          this.queryResults = pages[currentPage - 1];
          this.cd.detectChanges();
        },
        afterRender: (data, pagination) => { }
      });
      this.cd.detectChanges();
    });
  }

  ngOnInit() {
    this.pagination = $('#pagination');
  }

}
