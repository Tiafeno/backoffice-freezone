import { Component, OnInit, ViewChild } from '@angular/core';
import { config } from '../../../../environments/environment';
import * as moment from 'moment';
import { ReviewMailSupplierComponent } from '../review-mail-supplier/review-mail-supplier.component';
declare var $: any;

@Component({
  selector: 'app-review-supplier',
  templateUrl: './review-supplier.component.html',
  styleUrls: ['./review-supplier.component.css']
})
export class ReviewSupplierComponent implements OnInit {
  public Table: any;
  public selectedSupplier: any = {};

  @ViewChild(ReviewMailSupplierComponent) Mail: ReviewMailSupplierComponent;
  constructor() { }

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

    const reviewTable = $('#supplier-review-table');
    this.Table = reviewTable.DataTable({
      pageLength: 20,
      page: 1,
      ordering: false, // Activer ou désactiver l'affichage d'ordre
      fixedHeader: true,
      responsive: false,
      "sDom": 'rtip',
      processing: true,
      serverSide: true,
      columns: [
        {
          data: 'company_name', render: (data) => {
            return `<span class="badge badge-default">${data}</span>`;
          }
        },
        {
          data: 'reference', render: (data) => {
            return `<b>${data}</b>`;
          }
        },
        {
          data: 'phone', render: (data) => {
            return data;
          }
        },
        {
          data: 'email', render: (data) => {
            return `<a href="mailto:${data}" >${data}</a>`;
          }
        },
        {
          data: 'name', render: (data, type, row) => {
            return `${data}`;
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
                      <li><button class="btn btn-primary btn-icon-only btn-circle btn-air send-mail"><i class="la la-envelope"></i></button></li>
                   </ul>
                </div>`
        }
      ],
      initComplete: (setting, json) => {
        $('#supplier-review-table tbody').on('click', '.send-mail', ev => {
          ev.preventDefault();
          this.selectedSupplier = getElementData(ev);
          this.Mail.openDialog(this.selectedSupplier.id);
        });

      },
      ajax: {
        url: `${config.apiUrl}/supplier/review`,
        dataType: 'json',
        data: {
          columns: false,
          order: false,
        },
        beforeSend: function (xhr) {
          const __fzCurrentUser: any = JSON.parse(localStorage.getItem('__fzCurrentUser'));
          if (__fzCurrentUser && __fzCurrentUser.token) {
            xhr.setRequestHeader("Authorization",
              `Bearer ${__fzCurrentUser.token}`);
          }
        },
        type: 'POST',
      }
    });
  }

}
