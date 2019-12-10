import { Component, OnInit } from '@angular/core';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import * as moment from 'moment';
import { config } from '../../../../environments/environment';
import * as _ from 'lodash';
import { Helpers } from '../../../helpers';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

declare var $: any;

@Component({
  selector: 'app-product-lists',
  templateUrl: './product-lists.component.html',
  styleUrls: ['./product-lists.component.css']
})
export class ProductListsComponent implements OnInit {
  private WCAPI: any;
  private WPAPI: any;
  public Table: any;

  constructor(
    private apiWc: ApiWoocommerceService,
    private apiWp: ApiWordpressService,
    private router: Router,
    private Http: HttpClient
  ) {
    this.WCAPI = this.apiWc.getWoocommerce();
    this.WPAPI = this.apiWp.getWPAPI();
  }

  public reload() {
    this.Table.ajax.reload(null, false);
  }

  ngOnInit() {
    moment.locale('fr');

    const getElementData = (ev: any): any => {
      const el = $(ev.currentTarget).parents('tr');
      const data = this.Table.row(el).data();
      return data;
    };

    const productsTable = $('#products-table');
    this.Table = productsTable.DataTable({
      pageLength: 10,
      page: 1,
      ordering: false, // Activer ou désactiver l'affichage d'ordre
      fixedHeader: true,
      responsive: false,
      sDom: 'rtip',
      processing: true,
      serverSide: true,
      columns: [
        {
          data: 'ID', render: (data) => {
            return `<span>${data}</span>`;
          }
        },
        {
          data: 'name', render: (data, type, row) => {
            return `<span class="edit-product font-strong" style="cursor: pointer">${data}</span>`;
          }
        },
        {
          data: 'sku', render: (data, type, row) => {
            return _.isEmpty(data) ? 'Non définie' : data;
          }
        },
        {
          data: 'categories', render: (data, type, row) => {
            return data;
            // let ctg: Array<any> = _.isEmpty(data) ? [] : _.clone(data);
            // ctg = _.map(ctg, i => i.name);
            // return _.join(ctg, ', ');
          }
        },
        {
          data: 'status', render: (data) => {
            return data === 'publish' ? 'Publier' : 'En attente';
          }
        },
        {
          data: 'date_created', render: (data) => {
            return moment(data.date).fromNow();
          }
        },
        {
          data: null,
          render: (data, type, row, meta) => `
                <div class="fab fab-left">
                   <button class="btn btn-sm btn-primary btn-icon-only btn-circle btn-air" data-toggle="button">
                      <i class="fab-icon la la-bars"></i>
                      <i class="fab-icon-active la la-close"></i>
                   </button>
                   <ul class="fab-menu">
                      <li><button class="btn btn-danger btn-icon-only btn-circle btn-air remove-product"><i class="la la-trash"></i></button></li>
                   </ul>
                </div>`
        }
      ],
      initComplete: (setting, json) => {
        // Pour supprimer un produit
        $('#products-table tbody').on('click', '.remove-product', ev => {
          ev.preventDefault();
          Swal.fire({
            title: 'Confirmation',
            text: 'Supprimer un produit revient à supprimer tous les articles similaire aux fournisseurs. Voulez vous vraiment supprimer ce produit?',
            type: 'warning',
            showCancelButton: true
          }).then(result => {
            if (result.value) {
              Helpers.setLoading(true);
              const __product: any = getElementData(ev);
              this.WCAPI.delete(`products/${__product.ID}?force=true`, async (err, data, res) => {
                let remove = await this.Http.post<any>(`${config.apiUrl}/product/remove/${__product.ID}`, new FormData());
                remove.subscribe(resp => {
                  Helpers.setLoading(false);
                  this.reload();
                });
              });
            }
          });
        });

        //  Ajouter une envennement dans le titre
        $('#products-table tbody').on('click', '.edit-product', e => {
          e.preventDefault();
          const __product: any = getElementData(e);
          this.router.navigate(['/product', __product.ID]);
        });
      },
      ajax: {
        url: `${config.apiUrl}/product/`,
        dataType: 'json',
        data: {
          order: false,
        },
        beforeSend: function (xhr) {
          const __fzCurrentUser: any = JSON.parse(localStorage.getItem('__fzCurrentUser'));
          if (__fzCurrentUser && __fzCurrentUser.token) {
            xhr.setRequestHeader('Authorization',
              `Bearer ${__fzCurrentUser.token}`);
          }
        },
        type: 'POST',
      }
    });
  }


}
