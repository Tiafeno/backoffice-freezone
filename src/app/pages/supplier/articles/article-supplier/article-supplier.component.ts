import { Component, OnInit, ViewChild, ViewEncapsulation, ChangeDetectorRef, NgZone } from '@angular/core';
import { ApiWoocommerceService } from '../../../../_services/api-woocommerce.service';
import { ApiWordpressService } from '../../../../_services/api-wordpress.service';
import * as _ from 'lodash';
import { FilterArticleComponent } from '../../../../components/filter-article/filter-article.component';
import { FilterSearchArticleComponent } from '../../../../components/filter-search-article/filter-search-article.component';
import { ImportArticleComponent } from '../../../../components/import-article/import-article.component';
import { Helpers } from '../../../../helpers';
import { StatusArticleComponent } from '../../../../components/status-article/status-article.component';
import Swal from 'sweetalert2';
import { AuthorizationService } from '../../../../_services/authorization.service';
import { FzSecurityService } from '../../../../_services/fz-security.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';

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
   private adminAccess: boolean = true;
   public Products: any;
   public findWord: string = '';
   public Paging: any = false;
   public currentPage: number = 1;
   public perPage: number = 20;
   public Editor: any;
   public articleEdit: any;
   public thumbForm: FormGroup;
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
      private Security: FzSecurityService,
      private router: Router,
      private zone: NgZone
   ) {
      this.WP = apiWP.getWPAPI();
      this.WC = apiWC.getWoocommerce();
      this.adminAccess = this.authorisation.getCurrentUserRole() === 'administrator' ? true : false;
      this.thumbForm = new FormGroup({
         image: new FormControl('', Validators.required),
         product_id: new FormControl(0, Validators.required),
         article_id: new FormControl(0, Validators.required)
      });
   }

   ngOnInit() {
      this.paginationContainer = $('#demo');
      this.Query = this.WP.fz_product().context('edit').perPage(this.perPage).page(this.currentPage);
      $('#status-product-modal').on('hide.bs.modal', ev => {
         this.articleEdit = null;
      });
      $('#update-thumbnail-modal').on('hide.bs.modal', ev => {
         this.thumbForm.reset();
         this.cd.detectChanges();
      });

   }

   onSearchWord($event): void {
      this.findWord = _.clone($event.word);
   }

   public onChangeRoute(link: string) {
      this.zone.run(() => { this.router.navigateByUrl(link); })
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
      if (this.adminAccess) {
         this.articleEdit = _.clone(article);
         $('#status-product-modal').modal('show');
      } else {
         Swal.fire('Accès', "Accès non-aurotisé", 'error');
      }
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

      const status: string = !_.isUndefined(eventForm.status) ? eventForm.status : 'any';
      this.Query.param('status', _.isEmpty(status) ? 'any' : status);

      if (!_.isUndefined(eventForm.supplier)) {
         this.Query
            .param('filter[meta_key]', 'user_id')
            .param('filter[meta_value]', eventForm.supplier);
      }

      this.Query.headers().then(headers => {
         this.Query.then((fzProducts) => {
            this.loadData(fzProducts, headers);
         });
      }).catch(err => {
         Helpers.setLoading(false);
         Swal.fire('Désolé', "Votre session a expiré. Veuillez vous reconnecter. Merci", 'error');
      });
   }

   onSubmitThumbnail() {
      if (this.thumbForm.valid) {
         const Value: any = this.thumbForm.value;
         const uploadEl = (<HTMLInputElement>document.getElementById('upload-media'));
         const File = uploadEl.files[0]
         const Product: any = _.find(this.Products, { id: Value.article_id });
         Helpers.setLoading(true);
         this.WP.media()
            // Specify a path to the file you want to upload, or a Buffer
            .file(File)
            .create({
               title: Product.title.rendered,
               alt_text: Product.title.rendered,
               caption: Product.title.rendered,
            })
            .then((response) => {
               const newImageId = response.id;
               const data = {
                  images: [
                     { src: response.source_url }
                  ]
               };
               this.WC.post(`products/${Value.product_id}`, data, (err, data, res) => {
                  return this.WP.media().id(newImageId).update({
                     post: Value.product_id
                  }).then(() => {
                     this.onRefreshResults();
                     $('#update-thumbnail-modal').modal('hide');
                     Helpers.setLoading(false);
                  });
               })
            });
      }
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

   public isNumber(val) { return typeof val === 'number'; }
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
         const _marge = parseInt(product.marge, 10);
         const _margeDealer = parseInt(product.marge_dealer, 10);
         const _margeParticular = parseInt(product.marge_particular, 10);
         product.marge_particular = this.adminAccess ? (_.isNaN(_margeParticular) ? 'Non définie' : _margeParticular + '%') : 'Restreint';
         product.marge_dealer = this.adminAccess ? (_.isNaN(_margeDealer) ? 'Non définie' : _margeDealer + '%') : "Restreint";
         product.marge = this.adminAccess ? (_.isNaN(_marge) ? 'Non définie' : _marge + '%') : "Restreint";

         if (!_.isNaN(_margeParticular)) {
            const priceMargeParticular = (price * _margeParticular) * 100;
            product.price_particular = this.adminAccess ? Math.round(price + priceMargeParticular) : 'Restreint';
         } else {
            product.price_particular = 'Non définie';
         }

         if (!_.isNaN(_margeDealer)) {
            const priceMargeDealer = (price * _margeDealer) / 100;
            product.price_dealer = this.adminAccess ? Math.round(price + priceMargeDealer) : 'Restreint';
         } else {
            product.price_dealer = 'Non définie';
         }
         
         if (!_.isNaN(_marge)) {
            const priceMarge = (price * _marge) / 100;
            product.priceUF = Math.round(price + priceMarge);
         } else {
            product.priceUF = 'Non définie';
         }
         product.price = this.adminAccess ? price : 'Restreint';
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
         afterRender: (data, pagination) => {}
      });
      this.cd.detectChanges();
      this.onLoadLists();
      Helpers.setLoading(false);
   }

   private onLoadLists() {
      $('.update-thumbnail').on('click', event => {
         if (this.Security.hasAccess('s14')) {
            const data: any = $(event.currentTarget).data();
            this.thumbForm.patchValue({ product_id: data.product, article_id: data.article });
            $('#update-thumbnail-modal').modal('show');
            this.cd.detectChanges();
         }
      });
   }


}
