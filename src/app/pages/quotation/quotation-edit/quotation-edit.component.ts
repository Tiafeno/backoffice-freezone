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
            const ITEMS = this.ORDER.line_items;
         
            // Récuperer les informations du client
            await this.WPAPI
               .users()
               .id(this.ORDER.user_id)
               .context('edit')
               .then(user => { this.Author = _.clone(user); })
               .catch(error => {
                  Swal.fire('Erreur', "Compte du client introuvable. Le compte a été supprimer", 'error');
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
                     data: 'quantity' ,
                     render: (data, type, row) => {
                        const meta_data = _.clone(row.meta_data);
                        const metaStockRequest: any = _.find(meta_data, {key: 'stock_request'});
                        const stockRequestValue = _.isUndefined(metaStockRequest) ? 0 : parseInt(metaStockRequest.value, 10);
                        return _.isEqual(stockRequestValue, 0) ? data : stockRequestValue;
                     }
                  }, // Quantité du client
                  {
                     data: 'quantity',
                     render: (data, type, row) => {
                        const meta_data = _.clone(row.meta_data);
                        const metaSuppliers: any = _.find(meta_data, {key: 'suppliers'});
                        let quantityItemTakes = !_.isUndefined(metaSuppliers) ? _.map(JSON.parse(metaSuppliers.value), mt => parseInt(mt.get, 10)) : 0;
                        quantityItemTakes = _.isArray(quantityItemTakes) ? _.sum(quantityItemTakes) : 0;
                        return _.isEqual(quantityItemTakes, 0) ? 'Non definie' : quantityItemTakes;
                     }
                  },
                  {
                     data: 'meta_data', render: (data: Array<{id?: number, key: string, value: any}>) => {
                        const meta: any = _.find(data, { key: 'status' });
                        const intStatus: number = _.isUndefined(meta) ? 0 : parseInt(meta.value, 10);
                        const status: string = intStatus === 0 ? 'En attente' : (intStatus === 1 ? "Traitée" : "N/A");
                        const style: string = intStatus === 0 ? 'warning' : (intStatus === 1 ? "success" : "danger");
                        return `<span class="badge badge-${style}">${status}</span>`;
                     }
                  }, // Etat de l'article
                  {
                     data: 'meta_data', render: (data: Array<{id?: number, key: string, value: any}>) => {
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
                     data: null, render: data => {
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

                 /*  $('#quotation-view-supplier-modal').on('hide.bs.modal', e => {
                     if ($.fn.dataTable.isDataTable('#quotation-supplier-table')) {
                        this.qtSupplierTable.destroy();
                     }
                     this.objMetaSuppliers = [];
                     Helpers.setLoading(true);
                     this.WCAPI.get(`orders/${this.ID}`, (err, data, res) => {
                        Helpers.setLoading(false);
                        this.__ORDER__ = JSON.parse(res);
                        this.__ITEMS__ = this.__ORDER__.line_items;
                        this.Table.clear().draw();
                        this.Table.rows.add(this.__ITEMS__);
                        this.Table.columns.adjust().draw();

                        this.cd.detectChanges();
                     });

                  }); */
               }
            })
         });
      });
   }



}
