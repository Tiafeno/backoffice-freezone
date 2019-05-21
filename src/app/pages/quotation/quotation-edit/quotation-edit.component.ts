import { Component, OnInit, ViewEncapsulation, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Helpers } from '../../../helpers';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import Swal from 'sweetalert2';
import * as moment from 'moment'
import { QuotationViewComponent } from '../quotation-view/quotation-view.component';
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
  public Author: any;
  public Table: any;
  public qtSupplierTable: any;
  public Item: any;
  public objectMeta: Array<any> = [];
  public loading: boolean = false;

  @ViewChild(QuotationViewComponent) QuotationView: QuotationViewComponent;

  constructor(
    private route: ActivatedRoute,
    private apiWC: ApiWoocommerceService,
    private apiWP: ApiWordpressService,
    private cd: ChangeDetectorRef
  ) {
    this.WCAPI = this.apiWC.getWoocommerce();
    this.WPAPI = this.apiWP.getWPAPI();
  }

  ngOnInit() {
    moment.locale('fr');
    Helpers.setLoading(true);
    this.route.parent.params.subscribe(params => {
      this.ID = parseInt(params.id);
      this.WCAPI.get(`orders/${this.ID}`, (err, data, res) => {
        Helpers.setLoading(false);
        this.__ORDER__ = JSON.parse(res);
        this.__ITEMS__ = this.__ORDER__.line_items.line_items;
        this.WPAPI.users().id(this.__ORDER__.line_items.user_id).context('edit').then(user => { this.Author = _.clone(user); });
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
                let meta: any = _.find(data, { key: 'status' });
                let status: string = parseInt(meta.value) === 0 ? 'En attente' : (parseInt(meta.value) === 1 ? "Traitée" : "Rejeté");
                return `<span class="badge badge-success">${status}</span>`;
              }
            },
            {
              data: 'meta_data', render: (data) => {
                let meta: any = _.find(data, { key: 'suppliers' });
                if (!meta || _.isUndefined(meta)) return 'Non définie';
                let value: any = JSON.parse(meta.value);
                let countSuppliers = Object.keys(value);
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
            $('#quotation-edit-table tbody').on('click', '.edit-item', e => {
              e.preventDefault();
              let el = $(e.currentTarget).parents('tr');
              let item = this.Table.row(el).data();
              this.Item = _.cloneDeep(item); // Contient l'item en cours de traitement
              Helpers.setLoading(true);
              this.WPAPI.fz_product().param('meta_key', "product_id").param('meta_value', this.Item.product_id).then(_response => {
                let __FZPRODUCTS__: Array<any> = _.clone(_response);
                this.__FZPRODUCTS__ = _.cloneDeep(__FZPRODUCTS__);// Collect tous les articles pour ce produit
                if (_.isEmpty(__FZPRODUCTS__)) {
                  Swal.fire('Désolé', "Aucun fournisseur ne posséde cette article", "warning");
                  Helpers.setLoading(false);
                  return false;
                }
                let user_ids: Array<number> = _.map(__FZPRODUCTS__, (product) => { return parseInt(product.user_id); });
                this.WPAPI.users().include(_.join(user_ids, ',')).roles('fz-supplier').context('edit').then(_users => {
                  let __USERS__: Array<any> = _.clone(_users);
                  this.qtSupplierTable = $('#quotation-supplier-table').DataTable({
                    // Installer le plugin WP Rest Filter (https://fr.wordpress.org/plugins/wp-rest-filter/)
                    fixedHeader: true,
                    responsive: false,
                    "sDom": 'rtip',
                    data: __USERS__,
                    columns: [
                      { data: 'id' }, // user_id
                      {
                        data: 'company_name', render: (data, type, row) => {
                          return data;
                        }
                      },
                      {
                        data: 'id', render: (data, type, row) => { // stock
                          let userId: any = data;
                          let pdt: any = _.find(__FZPRODUCTS__, { user_id: userId });
                          return pdt.total_sales;
                        }
                      },
                      {
                        data: 'id', render: (data) => {
                          let userId: any = data;
                          let pdt: any = _.find(__FZPRODUCTS__, { user_id: userId });
                          let dateReview: any = moment(pdt.date_review);
                          let dateLimit: any = moment().subtract(2, 'day');
                          let msg: string = dateLimit < dateReview ? "Traité" : "En attente";
                          let style: string = dateLimit < dateReview ? 'blue' : 'warning';
                          return `<span class="badge badge-${style}">${msg}</span>`;
                        }
                      }, // statut product
                      {
                        data: 'id', render: data => {
                          let userId: any = data;
                          let pdt: any = _.find(__FZPRODUCTS__, { user_id: userId });
                          return `${pdt.price} MGA`;
                        }
                      }, // price product
                      { data: 'commission', render: (data) => { return `${data}%` } },
                      {
                        data: null, render: (data, type, row) => {
                          let value: number = 0;
                          let metaData: any = _.find(this.Item.meta_data, { key: "suppliers" });
                          if (metaData && !_.isEmpty(metaData.value)) {
                            /**
                             * @return Array
                             */
                            let dataParser: Array<any> = JSON.parse(metaData.value); // [{supplier: 450, get: "2", product_id: 0, article_id: 0}] 
                            _.map(dataParser, (parse) => {
                              if (row.id === parse.supplier) {
                                value = parseInt(parse.get);
                              }
                            });
                          }

                          let fzProduct: any = _.find(__FZPRODUCTS__, { user_id: row.id });
                          return `<input type="number" class="input-increment" value="${value}" min="0" max="${fzProduct.total_sales}" 
                          data-product="${fzProduct.product_id}" data-supplier="${row.id}" data-article="${fzProduct.id}">`;
                        }
                      }
                    ],
                    initComplete: () => {
                      Helpers.setLoading(false);
                      $('#quotation-view-supplier-modal').modal('show');
                      $('.input-increment').on('change', ev => {
                        ev.preventDefault();

                        let element = $(ev.currentTarget);
                        let currentValue = element.val();
                        let id = element.data('supplier');
                        let productID = element.data('product');
                        let articleID = element.data('article');
                        productID = parseInt(productID);

                        let countInputSet = 0;

                        // Vérifier la quantité et la quantité ajouter pour les fournisseurs
                        $('input.input-increment').each((index, value) => {
                          let inputVal: any = $(value).val();
                          inputVal = parseInt(inputVal);
                          countInputSet += inputVal;
                        });

                        if (this.Item.quantity < countInputSet) {
                          element.val(Math.abs(parseInt(currentValue) - 1));
                          return false;
                        };
                        this.objectMeta = _.reject(this.objectMeta, {supplier: id});
                        this.objectMeta.push({ supplier: id, get: parseInt(element.val()), product_id: productID, article_id: articleID });
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
    this.objectMeta = _.filter(this.objectMeta, (meta) => meta.get !== 0);
    Helpers.setLoading(true);
    this.loading = true;
    let lineItems: Array<any>;
    lineItems = _.map(this.__ITEMS__, (item) => {
      let currentItem: any = _.cloneDeep(item); // product
      let currentMetaData: Array<any> = _.cloneDeep(currentItem.meta_data); // Product meta
      // Rechercher les modifications pour ce produit
      let metas: any = _.filter(this.objectMeta, { product_id: currentItem.product_id });
      
      currentMetaData = _.map(currentMetaData, meta => {
        if (meta.key === 'status') {
          if (_.isEmpty(metas)) {
            meta.value = 0;
          } else {
            let qts: Array<number> = _.map(metas, meta => { return parseInt(meta.get); });
            let collectQts = _.sum(qts);
            meta.value = collectQts < currentItem.quantity ? 0 : 1;
          }

          if (!meta.value) return meta;
          // Verifier si l'article est en review
          let aIds: Array<any> = _.map(metas, meta => meta.article_id); // Récuperer les identifiant des articles à ajouter
          let collectFZProducts: Array<any> = _.filter(this.__FZPRODUCTS__, (fz) => { return _.indexOf(aIds, fz.id) >= 0; });
          let cltResutls: Array<boolean> = _.map(collectFZProducts, prd => {
            let dateReview: any = moment(prd.date_review);
            let dateLimit: any = moment().subtract(2, 'day');
            return dateLimit < dateReview; // à jour
          });

          meta.value = _.indexOf(cltResutls, false) >= 0 ? 0 : 1;
          
        } else {
          meta.value = JSON.stringify(metas);
        }
        return meta;
      });
      let filterMetaSuppliers = _.filter(currentMetaData, {key: 'suppliers'} as any);
      if (_.isEmpty(filterMetaSuppliers)) currentMetaData.push({key: 'suppliers', value: JSON.stringify(metas)});
      currentItem.meta_data = _.clone(currentMetaData);
      return currentItem;
    });
    let data: any = { line_items: lineItems };
    this.WCAPI.put(`orders/${this.ID}`, data, (err, data, res) => {
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
