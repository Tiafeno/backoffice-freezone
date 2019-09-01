import { Component, OnInit, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import * as moment from 'moment';
import { Helpers } from '../../../helpers';
import { FzSecurityService } from '../../../_services/fz-security.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { config } from '../../../../environments/environment';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';
declare var $: any;

@Component({
  selector: 'app-quotation-treaty',
  templateUrl: './quotation-treaty.component.html',
  styleUrls: ['./quotation-treaty.component.css']
})
export class QuotationTreatyComponent implements OnInit {
  public Table: any;
  public queryPosition: any;
  public Woocommerce;

  @Output() Treaty = new EventEmitter<any>();

  constructor(
    private security: FzSecurityService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private apiWC: ApiWoocommerceService
  ) {
    this.Woocommerce = this.apiWC.getWoocommerce();
   }

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
    const quotationTable = $('#quotation-treaty-table');
    this.Table = quotationTable.DataTable({
      pageLength: 20,
      page: 1,
      ordering: false, // Activer ou désactiver l'affichage d'ordre
      fixedHeader: true,
      responsive: false,
      sDom: 'rtip',
      processing: true,
      serverSide: true,
      language: {
        url: "https://cdn.datatables.net/plug-ins/1.10.16/i18n/French.json"
      },
      columns: [
        { data: 'ID', render: (data) => { return `n°${data}` } },
        {
          data: 'author', render: (data, type, row) => {
            return `<span>${data.lastname} ${data.firstname}</span>`;
          }
        },
        {
          data: 'position', render: (data, type, row) => {
            const Status: Array<any> = [
              { value: 1, label: 'Envoyer', style: 'blue' },
              { value: 3, label: 'Terminée', style: 'success' },
            ];
            let position: any = _.find(Status, { value: data });
            return `<span class="badge badge-${position.style} status-switcher">${position.label}</span>`;
          }
        },
        {
          data: 'date_add', render: (data) => {
            return moment(data.date).format('LLL');
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
                <li><button class="btn btn-primary btn-icon-only btn-circle btn-air edit-quotation" data-id="${row.ID}"><i class="la la-edit"></i></button></li>
              </ul>
            </div>`
        }
      ],
      initComplete: (setting, json) => {
        $("#quotation-treaty-table tbody").on('click', '.edit-quotation', ev => {
          ev.preventDefault();
          let __quotation = getElementData(ev);
          this.router.navigate(['dashboard', 'quotation', __quotation.ID]);
        });

        $('#quotation-treaty-table tbody').on('click', '.status-switcher', e => {
          e.preventDefault();
          let __quotation = getElementData(e);
          if (this.security.hasAccess('s3')) {
            Helpers.setLoading(true);
            this.Woocommerce.get(`orders/${__quotation.ID}`, (err, data, res) => {
              Helpers.setLoading(false);
              let response: any = JSON.parse(res);
              this.Treaty.emit(response);

              this.cd.detectChanges();
            });
          }
        });
      },
      ajax: {
        url: `${config.apiUrl}/quotations/`,
        dataType: 'json',
        data: (d) => {
          d.columns = false;
          d.order = false;
          d.position = [1, 3];
        },
        beforeSend: function (xhr) {
          let __fzCurrentUser = JSON.parse(localStorage.getItem('__fzCurrentUser'));
          if (__fzCurrentUser && __fzCurrentUser.token) {
            xhr.setRequestHeader("Authorization",
              `Bearer ${__fzCurrentUser.token}`);
          }
        },
        error: (jqXHR, textStatus, errorThrow) => {
          let response: any = jqXHR.responseJSON;
        },
        type: 'POST',
      }

    });
  }

}
