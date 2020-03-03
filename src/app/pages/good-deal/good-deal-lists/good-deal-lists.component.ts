import { Component, OnInit } from '@angular/core';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';
import { AuthorizationService } from '../../../_services/authorization.service';
import * as moment from 'moment';
import * as _ from "lodash";
import { config } from '../../../../environments/environment';
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
    private apiWP: ApiWoocommerceService,
    private auth: AuthorizationService
  ) {
    this.wordpress = this.apiWP.getWoocommerce();
   }

  ngOnInit() {
    this.initializeTable();
  }

  initializeTable() {
    if ($.fn.dataTable.isDataTable('#good_deal')) {
      this.Table.destroy(); 
    }
    const annonceTable: any = $('#good_deal');
    console.log(annonceTable);
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
                <li><button class="btn btn-primary btn-icon-only btn-circle btn-air edit-sav" data-id="${row.ID}"><i class="la la-edit"></i></button></li>
                <li><button class="btn btn-danger btn-icon-only btn-circle btn-air remove-sav" data-id="${row.ID}" ><i class="la la-trash"></i></button></li>
              </ul>
            </div>`
        }
      ],
      initComplete: (setting, json) => { },
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
