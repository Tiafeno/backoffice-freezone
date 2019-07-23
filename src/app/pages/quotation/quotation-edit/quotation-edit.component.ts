import { Component, OnInit, ViewEncapsulation, ViewChild, ChangeDetectorRef, NgZone } from '@angular/core';
import { Helpers } from '../../../helpers';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import Swal from 'sweetalert2';
import * as moment from 'moment'
import { QuotationViewComponent } from '../quotation-view/quotation-view.component';
import { EditArticleComponent } from '../../supplier/articles/edit-article/edit-article.component';
import { FzSecurityService } from '../../../_services/fz-security.service';
import { FzServicesService } from '../../../_services/fz-services.service';
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
   public __ORDER__: any;
   private __ITEMS__: Array<any> = [];
   private __FZPRODUCTS__: Array<any> = [];

   public ID: number;
   public Editor: any;
   public designationTrigger: any = null;
   public Author: any;
   public Table: any;
   public qtSupplierTable: any;
   public Item: any;
   public canChangeMarge: boolean = true;
   public canChangeMargeDealer: boolean = true;
   public objectMeta: Array<any> = [];
   public loading: boolean = false;

   @ViewChild(QuotationViewComponent) QuotationView: QuotationViewComponent;
   @ViewChild(EditArticleComponent) EditArticle: EditArticleComponent;

   constructor(
      private route: ActivatedRoute,
      private router: Router,
      private apiWC: ApiWoocommerceService,
      private apiWP: ApiWordpressService,
      private cd: ChangeDetectorRef,
      private zone: NgZone,
      private security: FzSecurityService,
      private services: FzServicesService
   ) {
      this.WCAPI = this.apiWC.getWoocommerce();
      this.WPAPI = this.apiWP.getWPAPI();

      this.canChangeMarge = this.security.hasAccess('s4', false);
      this.canChangeMargeDealer = this.security.hasAccess('s5', false);
   }

   public currencyFormat(numb: number, cur: string = "MGA"): string {
      return new Intl.NumberFormat('de-DE', {
         style: "currency",
         minimumFractionDigits: 0,
         currency: cur
      }).format(numb);
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
            Helpers.setLoading(false);
            this.__ORDER__ = JSON.parse(res);
            this.__ITEMS__ = this.__ORDER__.line_items.line_items;
            // Récuperer les informations du client
            await this.WPAPI
               .users()
               .id(this.__ORDER__.line_items.user_id)
               .context('edit')
               .then(user => { this.Author = _.clone(user); });

            // Crée la liste des produits dans la commande
            this.Table = $('#quotation-edit-table').DataTable({
               fixedHeader: true,
               responsive: false,
               "sDom": 'rtip',
               data: this.__ITEMS__,
               columns: [
                  { data: 'name' },
                  { data: 'quantity' },
                  {
                     data: 'meta_data', render: (data) => {
                        const meta: any = _.find(data, { key: 'status' });
                        const intStatus: number = parseInt(meta.value, 10);
                        const status: string = intStatus === 0 ? 'En attente' : (intStatus === 1 ? "Traitée" : "Rejeté");
                        const style: string = intStatus === 0 ? 'warning' : (intStatus === 1 ? "success" : "danger");
                        return `<span class="badge badge-${style}">${status}</span>`;
                     }
                  },
                  {
                     data: 'meta_data', render: (data) => {
                        let metaSupplier: any = _.find(data, { key: 'suppliers' });
                        if (!_.isObject(metaSupplier)) return 'Non définie';
                        let value: any = JSON.parse(metaSupplier.value);
                        value = _.filter(value, item => item.get !== 0);
                        let countSuppliers = Object.keys(value);
                        if (_.isEmpty(countSuppliers)) return 'Non définie';
                        return `<span class="badge badge-default">${countSuppliers.length} Fournisseur(s)</span>`;
                     }
                  },
                  {
                     data: null, render: (data) => {
                        return `<span class="btn btn-sm btn-primary edit-item">Gerer</span>`
                     }
                  }

               ],
               initComplete: () => {

                  // Modifier une article
                  $('#quotation-edit-table tbody').on('click', '.edit-item', e => {
                     e.preventDefault();
                     this.designationTrigger = e.currentTarget;
                     const el = $(e.currentTarget).parents('tr');
                     const item = this.Table.row(el).data();
                     this.Item = _.cloneDeep(item); // Contient l'item en cours de traitement
                     console.log(this.Item);
                     Helpers.setLoading(true);
                     this.WPAPI
                        .fz_product()
                        .context('edit')
                        .param('meta_key', "product_id")
                        .param('meta_value', this.Item.product_id)
                        .then(_response => {
                           let __FZPRODUCTS__: Array<any> = _.clone(_response);
                           this.__FZPRODUCTS__ = _.cloneDeep(__FZPRODUCTS__);// Collect tous les articles pour ce produit
                           // Vérfier si la liste des fournisseur disponible pour l'article est vide
                           if (_.isEmpty(__FZPRODUCTS__)) {
                              Swal.fire('Désolé', "Aucun fournisseur ne posséde cette article ou qu'il est encore en attente.", "warning");
                              Helpers.setLoading(false);
                              return false;
                           }
                           // Récuperer les fournisseurs (utilisateur) qui possède cette article
                           let user_ids: Array<number> = _.map(this.__FZPRODUCTS__, p => parseInt(p.user_id, 10));
                           this.WPAPI
                              .users()
                              .include(_.join(user_ids, ','))
                              .roles('fz-supplier')
                              .context('edit')
                              .then(_users => {
                                 const clientRole: string = _.isArray(this.Author.roles) ? this.Author.roles[0] : this.Author.roles;
                                 let __USERS__: Array<any> = _.clone(_users);
                                 this.qtSupplierTable = $('#quotation-supplier-table').DataTable({
                                    // Installer le plugin WP Rest Filter (https://fr.wordpress.org/plugins/wp-rest-filter/)
                                    fixedHeader: true,
                                    responsive: false,
                                    "sDom": 'rtip',
                                    data: __USERS__,
                                    columns: [
                                       {
                                          data: 'company_name', render: (data, type, row) => {
                                             return `<span>${data}</span>`
                                          }
                                       },
                                       {
                                          data: 'reference', render: (data, type, row) => {
                                             return `<span class="badge badge-default view-supplier" style="cursor: pointer" data-supplier="${row.id}">${data}</span>`
                                          }
                                       },
                                       {
                                          data: 'id', render: (data, type, row) => { // stock
                                             let userId: any = data;
                                             let pdt: any = _.find(this.__FZPRODUCTS__, { user_id: userId });
                                             return pdt.total_sales;
                                          }
                                       },
                                       {
                                          data: 'id', render: (data) => {
                                             let userId: any = data;
                                             let pdt: any = _.find(this.__FZPRODUCTS__, { user_id: userId });

                                             let dateLimit: any = moment(pdt.date_review).subtract(-1, 'days');
                                             let msg: string = dateLimit > moment() ? "Traité" : "En attente";
                                             let style: string = dateLimit > moment() ? 'blue' : 'warning';
                                             return `<span class="badge badge-${style}">${msg}</span>`;
                                          }
                                       }, // statut product
                                       {
                                          data: 'id', render: data => {
                                             const userId: any = data;
                                             const pdt: any = _.find(this.__FZPRODUCTS__, { user_id: userId });
                                             const price: number = parseInt(pdt.price, 10);
                                             const marge = clientRole === 'fz-company' ? (pdt.company_status === 'dealer' ? pdt.marge_dealer : pdt.marge) : pdt.marge_particular;

                                             const hisPrice = this.services.getBenefit(price, parseInt(marge, 10));
                                             return this.currencyFormat(hisPrice);
                                          }
                                       }, // price product
                                       {
                                          data: 'id', render: data => {
                                             let userId: any = data;
                                             let pdt: any = _.find(this.__FZPRODUCTS__, { user_id: userId });
                                             let article: any = JSON.stringify(pdt);
                                             return `<span class='badge badge-success view-article' style='cursor: pointer' data-article='${article}'>Voir</span>`;
                                          }
                                       }, // Produit
                                       {
                                          data: null, render: (data, type, row) => {
                                             let inputValue: number = 0;
                                             const metaSuppliers: any = _.find(this.Item.meta_data, { key: "suppliers" });
                                             if (metaSuppliers && !_.isEmpty(metaSuppliers.value)) {
                                                /**
                                                 * @return Array
                                                 */
                                                let dataParser: Array<any> = JSON.parse(metaSuppliers.value); // [{supplier: 450, get: "2", product_id: 0, article_id: 0}] 
                                                _.map(dataParser, (parse) => {
                                                   if (row.id === parse.supplier) {
                                                      inputValue = parseInt(parse.get);
                                                   }
                                                });
                                             }

                                             let fzProduct: any = _.find(this.__FZPRODUCTS__, { user_id: row.id });

                                             const dateLimit: any = moment(fzProduct.date_review).subtract(-1, 'days');
                                             let disabled: boolean = dateLimit < moment();

                                             return `<input type="number" class="input-increment form-control prd_${fzProduct.id}" 
                                       value="${inputValue}" min="0" max="${fzProduct.total_sales}" ${disabled ? "disabled='disabled'" : ''}
                                       data-product="${fzProduct.product_id}" 
                                       data-supplier="${row.id}" 
                                       data-article="${fzProduct.id}">`;
                                          }
                                       }
                                    ],
                                    initComplete: () => {
                                       Helpers.setLoading(false);

                                       $('#quotation-view-supplier-modal').modal('show');

                                       $('#quotation-supplier-table tbody').on('click', '.view-supplier', ev => {
                                          ev.preventDefault();
                                          const element = $(ev.currentTarget);
                                          const elData: any = $(element).data();
                                          $('.modal').modal('hide');
                                          setTimeout(() => {
                                             this.zone.run(() => this.router.navigate(['/supplier', elData.supplier, 'edit']));
                                          }, 600);
                                       });

                                       $('#quotation-supplier-table tbody').on('click', '.view-article', ev => {
                                          ev.preventDefault();
                                          let data: any = $(ev.currentTarget).data();
                                          this.Editor = _.clone(data.article);
                                          this.cd.detectChanges();
                                       });

                                       $('#quotation-supplier-table tbody').on('change', '.input-increment', ev => {
                                          ev.preventDefault();

                                          let element = $(ev.currentTarget);
                                          let currentValue = $(element).val();
                                          currentValue = parseInt(currentValue, 10);
                                          const elData: any = $(element).data();
                                          let countInputSet = 0;

                                          // Vérifier la quantité et la quantité ajouter pour les fournisseurs
                                          $(`input.input-increment`).each((index, value) => {
                                             let inputVal: any = $(value).val();
                                             inputVal = parseInt(inputVal, 10);
                                             countInputSet += inputVal;
                                          });

                                          if (this.Item.quantity < countInputSet) {
                                             element.val(Math.abs(parseInt(currentValue) - 1));
                                             return false;
                                          };

                                          this.objectMeta = _.reject(this.objectMeta, { article_id: elData.article });
                                          this.objectMeta.push({
                                             supplier: parseInt(elData.supplier, 10),
                                             get: parseInt(element.val(), 10),
                                             product_id: parseInt(elData.product, 10),
                                             article_id: elData.article
                                          });

                                       });

                                       this.cd.detectChanges();
                                    }
                                 })
                              });

                        });
                  });

                  $('#quotation-view-supplier-modal').on('hide.bs.modal', e => {
                     if ($.fn.dataTable.isDataTable('#quotation-supplier-table')) {
                        this.qtSupplierTable.destroy();
                     }
                     this.objectMeta = [];
                     Helpers.setLoading(true);
                     this.WCAPI.get(`orders/${this.ID}`, (err, data, res) => {
                        Helpers.setLoading(false);
                        this.__ORDER__ = JSON.parse(res);
                        this.__ITEMS__ = this.__ORDER__.line_items.line_items;
                        this.Table.clear().draw();
                        this.Table.rows.add(this.__ITEMS__);
                        this.Table.columns.adjust().draw();

                        this.cd.detectChanges();
                     });

                  });
               }
            })
         });
      });
   }

   /**
    * Enregistrer le meta data pour les produits dans la commande
    */
   onSaveQuotationPdt() {
      if (_.isEmpty(this.objectMeta)) return false;
      //this.objectMeta = _.filter(this.objectMeta, (meta) => meta.get !== 0);
      Helpers.setLoading(true);
      this.loading = true;
      let lineItems: Array<any>;
      lineItems = _.map(this.__ITEMS__, (item) => {
         const currentItem: any = _.cloneDeep(item); // product
         let currentMetaData: Array<any> = _.cloneDeep(currentItem.meta_data); // Product meta
         // Rechercher les modifications pour ce produit
         const metas: any = _.filter(this.objectMeta, { product_id: currentItem.product_id });
         if (_.isEmpty(metas)) return item;

         currentMetaData = _.map(currentMetaData, meta => {
            if (meta.key === 'status') {
               if (_.isEmpty(metas)) {
                  meta.value = 0;
               } else {
                  let qts: Array<number> = _.map(metas, meta => { return parseInt(meta.get, 10); });
                  let collectQts = _.sum(qts);
                  meta.value = collectQts < currentItem.quantity ? 0 : 1;
               }

               if (!meta.value) return meta;
               // Verifier si l'article est en review
               const aIds: Array<any> = _.map(metas, meta => meta.article_id); // Récuperer les identifiant des articles à ajouter
               const collectFZProducts: Array<any> = _.filter(this.__FZPRODUCTS__, (fz) => { return _.indexOf(aIds, fz.id) >= 0; });
               const cltResutls: Array<boolean> = _.map(collectFZProducts, prd => {
                  const dateNow: any = moment();
                  let dateLimit: any = moment(prd.date_review).subtract(-1, 'days');

                  return dateLimit > dateNow; // à jour
               });

               meta.value = _.indexOf(cltResutls, false) >= 0 ? 0 : 1;

            } else {
               meta.value = JSON.stringify(metas);
            }
            return meta;
         });
         const filterMetaSuppliers = _.filter(currentMetaData, { key: 'suppliers' } as any);
         if (_.isEmpty(filterMetaSuppliers)) currentMetaData.push({ key: 'suppliers', value: JSON.stringify(metas) });
         currentItem.meta_data = _.clone(currentMetaData);
         return currentItem;
      });
      const data: any = { line_items: lineItems };
      this.WCAPI.put(`orders/${this.ID}`, data, (err, d, res) => {
         let response: any = JSON.parse(res);
         this.__ITEMS__ = response.line_items.line_items;
         this.Table.clear().draw();
         this.Table.rows.add(this.__ITEMS__);
         this.Table.columns.adjust().draw();

         Helpers.setLoading(false);
         this.loading = false;
         this.cd.detectChanges();
         $('#quotation-view-supplier-modal').modal('hide');

      });
   }

}
