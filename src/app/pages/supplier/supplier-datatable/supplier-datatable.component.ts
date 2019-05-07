import { Component, OnInit, ViewEncapsulation, AfterContentInit } from '@angular/core';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import * as moment from 'moment';
import * as _ from 'lodash';
import  swal  from 'sweetalert2';
import { config } from '../../../../environments/environment';
import { Helpers } from '../../../helpers';
import { Router } from '@angular/router';
declare var $: any;

@Component({
  selector: 'app-supplier-datatable',
  templateUrl: './supplier-datatable.component.html',
  styleUrls: ['./supplier-datatable.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class SupplierDatatableComponent implements OnInit, AfterContentInit {
  public WPAPI: any;
  public suppliers: any;
  public Table: any;

  constructor(
    private apiWP: ApiWordpressService,
    private router: Router
  ) {
    this.WPAPI = apiWP.getWPAPI();
  }

  public reload(): void {
    this.Table.ajax.reload(null, false);
  }

  ngAfterContentInit() {
    moment.locale('fr');
    const getElementData = (ev: any): any => {
      let el = $(ev.currentTarget).parents('tr');
      let data = this.Table.row(el).data();
      return data;
    };
    const supplierTable = $('#supplier-table');
    this.Table = supplierTable.DataTable({
      pageLength: 10,
      page: 1,
      ordering: false, // Activer ou désactiver l'affichage d'ordre
      fixedHeader: true,
      responsive: false,
      "sDom": 'rtip',
      processing: true,
      serverSide: true,
      columns: [
        { data: 'ID', render: (data) => { 
            return data; 
          }
        },
        { data: 'firstname', render: (data, type, row) => {
            return `<span>${row.lastname} ${data}</span>`;
          }
        },
        { data: 'reference', render: (data, type, row) => {
            return data;
          }
        },
        { data: 'commission', render: (data, type, row) => {
            return `${data}%`;
          }
        },
        { data: 'data', render: (data) => {
            return data.user_email;
          }
        },
        { data: 'date_add', render: (data) => {
            return data;
          }
        },
        { data: null,
          render: (data, type, row, meta) => `
                <div class="fab fab-left">
                   <button class="btn btn-sm btn-primary btn-icon-only btn-circle btn-air" data-toggle="button">
                      <i class="fab-icon la la-bars"></i>
                      <i class="fab-icon-active la la-close"></i>
                   </button>
                   <ul class="fab-menu">
                      <li><button class="btn btn-primary btn-icon-only btn-circle btn-air edit-supplier"><i class="la la-edit"></i></button></li>
                      <li><button class="btn btn-danger btn-icon-only btn-circle btn-air remove-supplier"><i class="la la-trash"></i></button></li>
                   </ul>
                </div>`
        }
      ],
      initComplete: (setting, json) => {
        // Supprimer un fournisseur
        $('#supplier-table tbody').on('click', '.remove-supplier', e => {
          e.preventDefault();
          let __supplier = getElementData(e);
          swal.fire({
            title: "Confirmation",
            text: "Voulez vous vraiment supprimer ce fournisseur?",
            type: 'warning',
            showCancelButton: true
          }).then(result => {
            if (result.value) {
              Helpers.setLoading(true);
              this.WPAPI.users().id(__supplier.ID).delete({force: true, reassign: 1}).then(resp => {
                Helpers.setLoading(false);
                this.reload();
                swal.fire("Succès", "Client supprimer avec succès", 'success');
              });
            }
          })
        });

        // Modifier les informations du fournisseur
        $('#supplier-table tbody').on('click', '.edit-supplier', e => {
          e.preventDefault();
          let __supplier = getElementData(e);
          this.router.navigate(['/supplier', __supplier.ID]);
        });
      },
      ajax: {
        url: `${config.apiUrl}/suppliers/`,
        dataType: 'json',
        data: {
          //columns: false,
          order: false,
        },
        beforeSend: function (xhr) {
          let __fzCurrentUser = JSON.parse(localStorage.getItem('__fzCurrentUser'));
          if (__fzCurrentUser && __fzCurrentUser.token) {
            xhr.setRequestHeader("Authorization",
              `Bearer ${__fzCurrentUser.token}`);
          }
        },
        type: 'POST',
      }
    });
  }

  ngOnInit() {
    
  }

}
