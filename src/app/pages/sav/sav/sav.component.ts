import { Component, OnInit } from '@angular/core';
import { config } from '../../../../environments/environment';
import * as moment from 'moment';
import * as _ from 'lodash';
declare var $:any;

@Component({
  selector: 'app-sav',
  templateUrl: './sav.component.html',
  styleUrls: ['./sav.component.css']
})
export class SavComponent implements OnInit {
  public Table: any;
  constructor() { }

  public reload(): void {
    this.Table.ajax.reload(null, false);
  }

  ngOnInit() {
    moment.locale('fr');
    const getElementData = (ev: any): any => {
      let el = $(ev.currentTarget).parents('tr');
      let data = this.Table.row(el).data();
      return data;
    };
    const savTable = $('#sav-table');
    this.Table = savTable.DataTable({
      pageLength: 10,
      page: 1,
      ordering: false, // Activer ou désactiver l'affichage d'ordre
      fixedHeader: true,
      responsive: false,
      "sDom": 'rtip',
      processing: true,
      serverSide: true,
      columns: [
        { data: 'ID', render: (data) => { return `n°${data}`} },
        {
          data: 'auctor', render: (data, type, row) => {
            if (_.isEmpty(data)) return "Non renseigner";
            return `<span>${data.data.last_name} ${data.data.first_name}</span>`;
          }
        },
        {
          data: 'reference', render: (data, type, row) => {
            if (_.isEmpty(data)) return 'Non renseigner';
            return `<span class="badge badge-success ">${data}</span>`;
          }
        },
        {
          data: 'product', render: (data, type, row) => {
            return `<span class="badge badge-default ">${data}</span>`;
          }
        },
        {
          data: 'mark', render: (data, type, row) => {
            return `<span class="badge badge-default ">${data}</span>`;
          }
        },
        {
          data: 'date_appointment', render: (data, type, row) => {
            let dt = moment(data, 'DD-MM-YYYY HH:mm:ss').format('LLL');
            return `<span class="badge badge-success ">${dt}</span>`;
          }
        },
        {
          data: 'date_add', render: (data, type, row) => {
            let dt = moment(data).format('LLL');
            return `<span class="badge badge-success ">${dt}</span>`;
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
                <li><button class="btn btn-primary btn-icon-only btn-circle btn-air edit-sa" data-id="${row.ID}"><i class="la la-edit"></i></button></li>
                <li><button class="btn btn-danger btn-icon-only btn-circle btn-air remove-sav" data-id="${row.ID}" ><i class="la la-trash"></i></button></li>
              </ul>
            </div>`
        }
      ],
      initComplete: (setting, json) => {

      },
      ajax: {
        url: `${config.apiUrl}/sav/`,
        dataType: 'json',
        data: (d) => {
          d.columns = false;
          d.order = false;
        },
        beforeSend: function (xhr) {
          let __fzCurrentUser = JSON.parse(localStorage.getItem('__fzCurrentUser'));
          if (__fzCurrentUser && __fzCurrentUser.token) {
            xhr.setRequestHeader("Authorization",
              `Bearer ${__fzCurrentUser.token}`);
          }
        },
        type: 'GET',
      }

    });
  }

}
