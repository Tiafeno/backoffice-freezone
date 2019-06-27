import {Component, OnInit, ViewChild, ViewEncapsulation, ChangeDetectorRef} from '@angular/core';
import {ApiWoocommerceService} from '../../../_services/api-woocommerce.service';
import {ApiWordpressService} from '../../../_services/api-wordpress.service';
import * as _ from 'lodash';
import {FilterArticleComponent} from '../../../components/filter-article/filter-article.component';
import {FilterSearchArticleComponent} from '../../../components/filter-search-article/filter-search-article.component';
import {ImportArticleComponent} from '../../../components/import-article/import-article.component';
import {Helpers} from '../../../helpers';
import {StatusArticleComponent} from '../../../components/status-article/status-article.component';

declare var $: any;

@Component({
  selector: 'app-article-supplier',
  templateUrl: './article-supplier.component.html',
  styleUrls: ['./article-supplier.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ArticleSupplierComponent implements OnInit {
  private WP: any;
  private WC: any;
  private Query: any;
  public Products: any;
  public findWord: string = '';
  public Paging: any = false;
  public currentPage: number = 1;
  public perPage: number = 20;
  public Editor: any;
  public articleEdit: any;
  private paginationContainer: any;

  @ViewChild(FilterArticleComponent) public Filter: FilterArticleComponent;
  @ViewChild(FilterSearchArticleComponent) public Search: FilterSearchArticleComponent;
  @ViewChild(ImportArticleComponent) public Importation: ImportArticleComponent;
  @ViewChild(StatusArticleComponent) public Status: StatusArticleComponent;

  constructor(
    private apiWC: ApiWoocommerceService,
    private apiWP: ApiWordpressService,
    private cd: ChangeDetectorRef
  ) {
    this.WP = apiWP.getWPAPI();
    this.WC = apiWC.getWoocommerce();
  }

  ngOnInit() {
    this.paginationContainer = $('#demo');
    this.Query = this.WP.fz_product().context('edit').perPage(this.perPage).page(this.currentPage);
    $('#status-product-modal').on('hide.bs.modal', ev => {
      this.articleEdit = null;
    });
  }

  onSearchWord($event): void {
    this.findWord = _.clone($event.word);
  }

  onEditArticle(id: number): void {
    Helpers.setLoading(true);
    this.WP.fz_product().id(id).context('edit').then(article => {
      this.Editor = _.clone(article);
      this.cd.detectChanges();
      Helpers.setLoading(false);
    });
  }

  onChangeStatus(article: any) {
    this.articleEdit = _.clone(article);
    $('#status-product-modal').modal('show');
  }

  /**
   * @param $event {word: "", supplier: null, categorie: null}
   */
  onSubmit($event): void | boolean {
    if (_.isUndefined($event) || _.isEmpty($event)) return false;
    Helpers.setLoading(true);

    if (!_.isUndefined($event.form.word)) {
      this.Query.search($event.form.word);
    }

    if (!_.isUndefined($event.form.categorie)) {
      this.Query.param('product_cat', $event.form.categorie);
    }

    if (!_.isUndefined($event.form.supplier)) {
      this.Query
        .param('filter[meta_key]', 'user_id')
        .param('filter[meta_value]', $event.form.supplier);
    }

    this.Query.headers().then(headers => {
      this.Query.then((fzProducts) => {
        this.loadData(fzProducts, headers);
      });
    });

  }

  onRefreshResults() {
    Helpers.setLoading(true);
    this.Query.page(this.currentPage).headers().then(headers => {
      this.Query.page(this.currentPage).then((fzProducts) => {
        this.loadData(fzProducts, headers);
      });
    });
  }

  onChangePage($page: number): void {
    Helpers.setLoading(true);
    this.Query.page($page).headers().then(headers => {
      this.Query.page($page).then((fzProducts) => {
        this.currentPage = $page;
        this.loadData(fzProducts, headers);
      });
    });
  }

  loadData(fzProducts: any, header?: any): void {
    this.Paging = false;
    if (!_.isEmpty(fzProducts)) {
      const result: any = !_.isUndefined(header) ? header : null;
      if (!_.isNull(result)) {
        this.Paging = {};
        this.Paging._totalPages = parseInt(result['x-wp-totalpages'], 10);
        this.Paging._total = parseInt(result['x-wp-total'], 10);
      }
    }
    this.Products = _.isEmpty(fzProducts) ? [] : fzProducts;
    this.Products = _.map(this.Products, product => {
      const price = parseInt(product.price, 10);
      const priceMarge = (price * parseInt(product.marge, 10)) / 100;
      product.priceUF = priceMarge + price;
      return product;
    });

    this.paginationContainer.pagination({
      dataSource: _.range(this.Paging._total),
      totalNumber: this.Paging._total,
      pageNumber: this.currentPage,
      pageSize: this.perPage,
      showPrevious: false,
      showNext: false,
      ulClassName: 'pagination justify-content-center',
      className: 'page-item',
      activeClassName: 'active',
      afterPageOnClick: (data, pagination) => {
        this.onChangePage(parseInt(pagination, 10));
      },
      afterRender: (data, pagination) => {

      }
    });
    this.cd.detectChanges();
    Helpers.setLoading(false);
  }


}
