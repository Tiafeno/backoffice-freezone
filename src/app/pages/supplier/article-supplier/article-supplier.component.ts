import {Component, OnInit, ViewChild, ViewEncapsulation, ChangeDetectorRef} from '@angular/core';
import {ApiWoocommerceService} from '../../../_services/api-woocommerce.service';
import {ApiWordpressService} from '../../../_services/api-wordpress.service';
import * as _ from 'lodash';
import {FilterArticleComponent} from '../../../components/filter-article/filter-article.component';
import {FilterSearchArticleComponent} from '../../../components/filter-search-article/filter-search-article.component';
import {ImportArticleComponent} from '../../../components/import-article/import-article.component';
import {Helpers} from '../../../helpers';
import {StatusArticleComponent} from '../../../components/status-article/status-article.component';
import Swal from 'sweetalert2';
import { AuthorizationService } from '../../../_services/authorization.service';
import { FzSecurityService } from '../../../_services/fz-security.service';

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
  private accessValue: boolean = true;
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
    private cd: ChangeDetectorRef,
    private authorisation: AuthorizationService,
    private Security: FzSecurityService
  ) {
    this.WP = apiWP.getWPAPI();
    this.WC = apiWC.getWoocommerce();
    this.accessValue = this.authorisation.getCurrentUserRole() === 'administrator' ? true : false;
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

  /**
   * Cette evennement ce declanche quand on click sur modifier une article
   * @param id
   */
  onEditArticle(id: number): void {
    if (this.Security.hasAccess('s10', true)) {
      Helpers.setLoading(true);
      this.WP.fz_product().id(id).context('edit').then(article => {
        this.Editor = _.clone(article);
        this.cd.detectChanges();
        Helpers.setLoading(false);
      });
    }
    
  }

  onChangeStatus(article: any) {
    this.articleEdit = _.clone(article);
    $('#status-product-modal').modal('show');
  }

  /**
   * Envoyer la filtre de recherche
   * @param $event {word: "", supplier: null, categorie: null}
   */
  onSubmit($event): void | boolean {
    if (_.isUndefined($event) || _.isEmpty($event)) return false;
    Helpers.setLoading(true);
    const eventForm: any = $event.form;

    if (!_.isUndefined(eventForm.word)) {
      this.Query.search(eventForm.word);
    }

    if (!_.isUndefined(eventForm.categorie)) {
      this.Query.param('product_cat', eventForm.categorie);
    }

    const status: string  = !_.isUndefined(eventForm.status) ? eventForm.status : 'any';
    this.Query.param('status', _.isEmpty(status) ? 'any' : status);

    if (!_.isUndefined(eventForm.supplier)) {
      this.Query.param('filter[meta_key]', 'user_id')
        .param('filter[meta_value]', eventForm.supplier);
    }

    this.Query.headers().then(headers => {
      this.Query.then((fzProducts) => {
        this.loadData(fzProducts, headers);
      });
    }).catch(err => {
      Helpers.setLoading(false);
      Swal.fire('Désolé', "Veuillez vous reconnecter. Merci", 'error');
    });
  }

  /**
   * Actualisez la liste apres l'ajout d'un nouveau article
   */
  onRefreshResults() {
    Helpers.setLoading(true);
    this.Query.page(this.currentPage).headers().then(headers => {
      this.Query.page(this.currentPage).then((fzProducts) => {
        this.loadData(fzProducts, headers);
      }).catch(err => {
        Swal.fire('Désolé', err.message, 'error');
      });
    });
  }

  /**
   * Cete fonction permet de changeer les resultats quand on change de page
   * dans la pagination.
   * @param $page
   */
  onChangePage($page: number): void {
    Helpers.setLoading(true);
    this.Query.page($page).headers().then(headers => {
      this.Query.page($page).then((fzProducts) => {
        this.currentPage = $page;
        this.loadData(fzProducts, headers);
      }).catch(err => {
        Swal.fire('Désolé', err.message, 'error');
      });
    });
  }

  private loadData(fzProducts: any, header?: any): void {
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
      product.marge = this.accessValue ? product.marge + '%' : 'Restreint';
      product.marge_dealer = this.accessValue ? product.marge_dealer + '%' : 'Restreint';
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
