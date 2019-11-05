import { Component, OnInit, ViewEncapsulation, ViewChild, NgZone } from '@angular/core';
import { Helpers } from '../../../helpers';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import * as moment from 'moment'
import { QuotationViewComponent } from '../quotation-view/quotation-view.component';
import { FzSecurityService } from '../../../_services/fz-security.service';
import Swal from 'sweetalert2';
import { Metadata } from '../../../metadata';
import { Article } from '../../articles';
import { OrderItem } from '../../../order.item';
declare var $: any;

@Component({
   selector: 'app-quotation-edit',
   templateUrl: './quotation-edit.component.html',
   styleUrls: ['./quotation-edit.component.css'],
   encapsulation: ViewEncapsulation.None
})
export class QuotationEditComponent implements OnInit {
   private WCAPI: any;
   private WPAPI: any;
   public ORDER: any; // Continent tous les données de la demande ou commande

   public ID: number; // ID de la demande ou commande
   public Editor: any;
   public designationTrigger: any = null;
   public Author: any;
   public Table: any;
   public qtSupplierTable: any;
   public canChangeMarge: boolean = true;
   public canChangeMargeDealer: boolean = true;
   public objectMeta: Array<any> = [];
   public loading: boolean = false;
   public articles: Array<Article>;

   @ViewChild(QuotationViewComponent) QuotationView: QuotationViewComponent;

   constructor(
      private route: ActivatedRoute,
      private router: Router,
      private apiWC: ApiWoocommerceService,
      private apiWP: ApiWordpressService,
      private zone: NgZone,
      private security: FzSecurityService,
   ) {
      this.WCAPI = this.apiWC.getWoocommerce();
      this.WPAPI = this.apiWP.getWPAPI();

      this.canChangeMarge = this.security.hasAccess('s4', false);
      this.canChangeMargeDealer = this.security.hasAccess('s5', false);
   }


   public closeSupplierView() {
      setTimeout(() => {
         $('#quotation-view-supplier-modal').modal('hide');
         if (!_.isNull(this.designationTrigger)) {
            let element: any = this.designationTrigger;
            $(element).trigger('click');
         }
      }, 600)
   }

   /**
    * // particular, dealer & professional
    * @param author - Object user
    */
   public getRoleClient(author: any): string {
      return '';
   }

   ngOnInit() {
      moment.locale('fr');
      Helpers.setLoading(true);
      this.route.parent.params.subscribe(params => {
         this.ID = parseInt(params.id);
         this.WCAPI.get(`orders/${this.ID}`, async (err, data, res) => {
            this.ORDER = JSON.parse(res);
            let line_items: Array<OrderItem> = this.ORDER.line_items;
            let line_items_zero: Array<OrderItem> = this.ORDER.line_items_zero;
            const ITEMS: Array<OrderItem> = _([]).push(_.xorWith(line_items_zero, line_items, _.isEqual)).flatten().value();


            // Récuperer les informations du client
            await this.WPAPI
               .users()
               .id(this.ORDER.user_id)
               .context('edit')
               .then(user => { this.Author = _.clone(user); })
               .catch(error => {
                  Swal.fire('Erreur', "Compte du client introuvable. Le compte a été supprimer", 'error');
               });

            const itemArticleIdsFn = (productId: number): Array<number> => {
               const item: OrderItem = _.find(ITEMS, { product_id: productId });
               const metadata: Array<Metadata> = _.clone(item.meta_data);
               const hasSupplier: any = _.find(metadata, { key: 'suppliers' });
               if (_.isUndefined(hasSupplier)) return [];
               let suppliers: any = JSON.parse(hasSupplier.value);
               return _.map(suppliers, supplier => parseInt(supplier.article_id));
            };

            const getReflectItemArticleIds = (item: OrderItem): Array<any> => {
               let hasSuppliers: any = _.find(item.meta_data, {key: 'suppliers'});
               if (_.isUndefined(hasSuppliers)) return [];
               const suppliers: any = JSON.parse(hasSuppliers.value);
               let collectArticleIds: Array<number> = _.map(suppliers, meta => { return parseInt(meta.article_id, 10); });
               return _(this.articles).filter(article => _.indexOf(collectArticleIds, article.id) >= 0).value();
            };

            const getReflectItemQuantity = (item: OrderItem): number => {
               const articles: Array<Article> = getReflectItemArticleIds(item);
               const stocks: Array<number> = _.map(articles, article => parseInt(article.total_sales));
               return _.sum(stocks);
            };

            const hasReflectItemStockRequest = (item: OrderItem): boolean => {
               let has: any = _.find(item.meta_data, {key: 'stock_request'});
               if (_.isUndefined(has)) return false;

               return 0 === parseInt(has.value) || _.isNaN(parseInt(has.value)) ? false : true;
            };

            const getNoticeFn = (status: number): string => {
               const msg: string = status === 0 ? 'En attente' : (status === 1 ? "Traitée" : "N/A");
               const style: string = status === 0 ? 'warning' : (status === 1 ? "success" : "danger");
               return `<span class="badge badge-${style}">${msg}</span>`;
            };

            let allItemsArticleIds: Array<number> = _(ITEMS).map(item => {
               return itemArticleIdsFn(item.product_id);
            }).flatten().value();

            await this.WPAPI
               .fz_product()
               .context('edit')
               .param('include', allItemsArticleIds)
               .then(response => {
                  this.articles = _.clone(response);
               });

            // Crée la liste des produits dans la commande
            this.Table = $('#quotation-edit-table').DataTable({
               fixedHeader: true,
               responsive: false,
               "sDom": 'rtip',
               data: ITEMS,
               columns: [
                  { data: 'name' },
                  {
                     data: 'quantity',
                     render: (qty, type, item) => {
                        const meta_data = _.clone(item.meta_data);
                        const metaStockRequest: any = _.find(meta_data, { key: 'stock_request' });
                        const stockRequestValue = _.isUndefined(metaStockRequest) ? 0 : parseInt(metaStockRequest.value, 10);
                        return _.isEqual(stockRequestValue, 0) ? qty : stockRequestValue;
                     }
                  }, // Quantité voulu
                  {
                     data: 'product_id',
                     render: (pId, type, item) => {
                        if (_.isEqual(item.quantity, 0)) return 0;
                        const articleIds: Array<number> = itemArticleIdsFn(parseInt(pId));
                        if (_.isEmpty(articleIds)) return 'Non définie';
                        const articles: Array<Article> = _(this.articles).filter(article => _.indexOf(articleIds, article.id) >= 0).value();
                        const stocks: Array<number> = _.map(articles, article => parseInt(article.total_sales));

                        return _.sum(stocks);
                     }
                  }, // quantité disponible pour le fournisseur
                  {
                     data: 'meta_data', render: (data: Array<Metadata>, type, item) => {

                        // Ajouter une posibilité de modification les demandes rejetée
                        if (_.isEqual(parseInt(this.ORDER.position), 2)) {
                           return getNoticeFn(1);
                        }

                        // Verifier le status par la quantité ajouter
                        // vérifier si la quantité ajouter est valide ou pas
                        // Si la quantité ajouter est inferieur à la quantité demander le status est ègale à 0 si le contraire 1
                        let result = (getReflectItemQuantity(item) < item.quantity && !hasReflectItemStockRequest(item)) ? 0 : 1;
                        if (!result) return getNoticeFn(result);

                        // Verifier si l'article est en review
                        const aIds: Array<any> = getReflectItemArticleIds(item);
                        const collectFZProducts: Array<any> = _.filter(this.articles, fz => { return _.indexOf(aIds, fz.id) >= 0; });
                        const dateNow: any = moment();
                        const todayAt6 = moment({
                           year: dateNow.year(),
                           month: dateNow.month(),
                           days: dateNow.date(),
                           hour: 6,
                           minute: 0
                        });
                        const cltResutls: Array<boolean> = _.map(collectFZProducts, prd => {
                           let dateLimit: any = moment(prd.date_review);
                           return dateLimit > todayAt6; // à jour
                        });

                        result = _.indexOf(cltResutls, false) >= 0 ? 0 : 1;
                        return getNoticeFn(result);
                     }
                  }, // Etat de l'article
                  {
                     data: 'meta_data', render: (data: Array<Metadata>, type, item) => {
                        if (_.isEqual(item.quantity, 0)) return '-';

                        let metaSupplier: any = _.find(data, { key: 'suppliers' });
                        if (!_.isObject(metaSupplier) || _.isEmpty(metaSupplier.value)) return 'Non définie';
                        let value: any = JSON.parse(metaSupplier.value);
                        value = _.filter(value, item => item.get !== 0);
                        let countSuppliers = Object.keys(value);
                        if (_.isEmpty(countSuppliers)) return 'Non définie';
                        return `<span class="badge badge-default">${countSuppliers.length} Fournisseur(s)</span>`;
                     }
                  }, // Nombre de fournisseur ajouter
                  {
                     data: 'quantity', render: qty => {
                        if (_.isEqual(qty, 0)) return '-';
                        return `<span class="btn btn-sm btn-primary edit-item">Gerer</span>`
                     }
                  }

               ],
               initComplete: () => {
                  Helpers.setLoading(false);
                  // Gerer une article
                  $('#quotation-edit-table tbody').on('click', '.edit-item', e => {
                     e.preventDefault();
                     this.designationTrigger = e.currentTarget;
                     const el = $(e.currentTarget).parents('tr');
                     const item = this.Table.row(el).data();
                     // Récuperer tous les articles de ce produit
                     this.zone.run(() => {
                        this.router.navigate(['/dashboard', 'quotation', this.ID, 'item', item.id]);
                     });
                  });

               }
            })
         });
      });
   }



}
