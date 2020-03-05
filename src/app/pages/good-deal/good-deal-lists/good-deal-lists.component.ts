import { Component, OnInit } from '@angular/core';
import { AuthorizationService } from '../../../_services/authorization.service';
import * as _ from "lodash";
import { config } from '../../../../environments/environment';
import { MSG } from '../../../defined';
import { WPGoodDeal } from '../../../annonce';
import Swal from 'sweetalert2';
import { Helpers } from '../../../helpers';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
declare var $: any;

@Component({
  selector: 'app-good-deal-lists',
  templateUrl: './good-deal-lists.component.html',
  styleUrls: ['./good-deal-lists.component.css']
})
export class GoodDealListsComponent implements OnInit {
  private wordpress: any;
  public perPage: number = 10;
  public dataTableId: string = "good_deal";
  private Table: any;
  constructor(
    private apiWP: ApiWordpressService,
    private auth: AuthorizationService
  ) {
    this.wordpress = this.apiWP.getWordpress();
   }

  ngOnInit() {
    this.initializeTable();
  }

  initializeTable() {
    if ($.fn.dataTable.isDataTable('#good_deal')) {
      this.Table.destroy(); 
    }
    const annonceTable: any = $('#good_deal');
    this.Table = annonceTable.DataTable({
      pageLength: this.perPage,
      page: 1,
      ordering: false, // Activer ou désactiver l'affichage d'ordre
      fixedHeader: true,
      responsive: false,
      sDom: 'rtip',
      processing: true,
      serverSide: true,
      columns: [
        { data: 'post_title', render: (data) => { return `${data}` } },
        {
          data: null,
          render: (data, type, row, meta) => `
            <div class="fab fab-left">
              <button class="btn btn-sm btn-primary btn-icon-only btn-circle btn-air" data-toggle="button">
                <i class="fab-icon la la-bars"></i>
                <i class="fab-icon-active la la-close"></i>
              </button>
              <ul class="fab-menu">
                <li><button class="btn btn-primary btn-icon-only btn-circle btn-air edit-annonce" data-id="${row.ID}"><i class="la la-edit"></i></button></li>
                <li><button class="btn btn-danger btn-icon-only btn-circle btn-air remove-annonce" data-id="${row.ID}" ><i class="la la-trash"></i></button></li>
              </ul>
            </div>`
        }
      ],
      initComplete: (setting, json) => {
        $(`#${this.dataTableId} tbody`).on('click', '.remove-annonce', ev => {
          ev.preventDefault();
          if (!this.auth.isAdministrator()) {
            Swal.fire(MSG.ACCESS.DENIED_TTL, MSG.ACCESS.DENIED_CTT, 'warning');
            return false;
          }
          const el: any = $(ev.currentTarget).parents('tr');
          const data: WPGoodDeal = this.Table.row(el).data();
          Swal.fire({
            title: 'Confirmation',
            html: `Voulez vous vraiment supprimer cette annonce?`,
            type: 'warning',
            showCancelButton: true
          }).then(result => {
            if (result.value) {
              Helpers.setLoading(true);
              this.wordpress.good_deal().id(data.ID).delete({ force: true }).then(resp => {
                Helpers.setLoading(false);
                this.ngOnInit();
              }, err => {
                Helpers.setLoading(false);
                Swal.fire('', err.message, 'error');
              });
            }
          });
        });
      },
      ajax: {
        url: `${config.apiUrl}/good-deals/`,
        dataType: 'json',
        data: d => {
          let query: any = {};
          query.length = d.length;
          query.start = d.start;
          return query;
        },

        beforeSend: function (xhr) {
          const __fzCurrentUser: any = JSON.parse(localStorage.getItem('__fzCurrentUser'));
          if (__fzCurrentUser && __fzCurrentUser.token) {
            xhr.setRequestHeader('Authorization',
              `Bearer ${__fzCurrentUser.token}`);
          }
        },
        type: 'GET',
      }
    });
  }

}
