import { Component, OnInit, ViewChild, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import * as _ from 'lodash';
import { FilterArticleComponent } from '../../../components/filter-article/filter-article.component';
import { FilterSearchArticleComponent } from '../../../components/filter-search-article/filter-search-article.component';
import { ImportArticleComponent } from '../../../components/import-article/import-article.component';
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
  public Categories: any;
  public Products: any;
  public findWord: string = '';
  public Paging: any = false;
  public currentPage: number = 1;
  public perPage: number = 10;
  public Editor: any;
  public articleEdit: any;

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
    this.Query = this.WP.fz_product().context('edit').per_page(this.perPage);
    $('#status-product-modal').on('hide.bs.modal', ev => {
      this.articleEdit = null;
    });
  }

  onSearchWord($event): void {
    this.findWord = _.clone($event.word);
  }

  onEditArticle(id: number): void {
    Helpers.setLoading(true);
    this.WP.fz_product().id(id).then(article => {
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
      this.Query.param('product_cat', $event.form.categorie)
    }

    if (!_.isUndefined($event.form.supplier)) {
      this.Query
        .param('filter[meta_key]', "user_id")
        .param('filter[meta_value]', $event.form.supplier);
    }

    this.Query.head().then(fzProducts => {
      this.loadData(fzProducts);
    })
  }

  onPrevious($event: any): void | boolean {
    const prevPage: number = this.currentPage - 1;
    if (prevPage > 0) {
      Helpers.setLoading(true);
      this.Query.page(prevPage).head().then(fzProducts => {
        this.loadData(fzProducts);
        this.currentPage = prevPage;
      });
    } else {
      return false;
    }
  }

  onNext($event: any): void | boolean {
    const nextPage: number = this.currentPage + 1;
    if (nextPage > parseInt(this.Paging.totalPages, 10)) return false;
    Helpers.setLoading(true);
    this.Query.page(nextPage).head().then(fzProducts => {
      this.loadData(fzProducts);
      this.currentPage = nextPage;
    });
  }

  onRefreshResults() {
    Helpers.setLoading(true);
    this.Query.page(this.currentPage).head().then(fzProducts => {
      this.loadData(fzProducts);
    });
  }

  onChangePage($page: number): void {
    Helpers.setLoading(true);
    this.Query.page($page).head().then(fzProducts => {
      this.loadData(fzProducts);
      this.currentPage = $page;
    });
  }

  loadData(fzProducts: any): void {
    if ( ! _.isEmpty(fzProducts) ) {
      this.Paging = _.clone(fzProducts['_paging']);
      this.Paging._totalPages = _.range(parseInt(this.Paging.totalPages, 10));
      delete fzProducts['_paging'];
    } else {
      this.Paging = false;
    }
    this.Products = _.isEmpty(fzProducts) ? [] : fzProducts;
    this.Products = _.map(this.Products, product => {
      const price = parseInt(product.price, 10);
      const priceMarge = (price * parseInt(product.marge, 10)) / 100;
      product.priceUF = priceMarge + price;
      return product;
    });
    this.cd.detectChanges();
    Helpers.setLoading(false);
  }

}
