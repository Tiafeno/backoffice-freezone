import { Component, OnInit, ViewEncapsulation, ViewChild, ChangeDetectorRef } from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Router } from '@angular/router';
import { config } from '../../../../environments/environment';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import Swal from 'sweetalert2';
import { Helpers } from '../../../helpers';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';
import { StatusQuotationSwitcherComponent } from '../../../components/status-quotation-switcher/status-quotation-switcher.component';
import { AuthorizationService } from '../../../_services/authorization.service';
import { FzSecurityService } from '../../../_services/fz-security.service';
import { QuotationTreatyComponent } from '../quotation-treaty/quotation-treaty.component';
declare var $: any;
@Component({
  selector: 'app-quotation--datatable',
  templateUrl: './quotation--datatable.component.html',
  styleUrls: ['./quotation--datatable.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class QuotationDatatableComponent implements OnInit {
  public Table: any;
  public qtSelected: any = null;
  public queryPosition: any = null;
  public WPAPI: any;
  public WCAPI: any;

  @ViewChild(StatusQuotationSwitcherComponent) QuotationSwitcher: StatusQuotationSwitcherComponent;
  @ViewChild(QuotationTreatyComponent) QuotationTreaty: QuotationTreatyComponent;

  setQtSelected(order: any) {
    this.qtSelected = _.clone(order);
  }

  constructor(
    private router: Router,
    private apiWP: ApiWordpressService,
    private apiWC: ApiWoocommerceService,
    private cd: ChangeDetectorRef,
    private auth: AuthorizationService,
    private security: FzSecurityService
  ) {
    this.WPAPI = this.apiWP.getWPAPI();
    this.WCAPI = this.apiWC.getWoocommerce();
  }

  public reload(): void {
    this.Table.ajax.reload(null, false);
    this.QuotationTreaty.reload();
  }

  onChangePosition($event): void | boolean {
    let target: any = $event.target;
    let value: string = $(target).val();
    this.queryPosition = value;
    this.Table.ajax.reload(null, false);
  }

  ngOnInit() {
    moment.locale('fr');
    const getElementData = (ev: any): any => {
      let el = $(ev.currentTarget).parents('tr');
      let data = this.Table.row(el).data();
      return data;
    };
    const quotationTable = $('#quotation-table');
    this.Table = quotationTable.DataTable({
      pageLength: 20,
      page: 1,
      ordering: false, // Activer ou désactiver l'affichage d'ordre
      fixedHeader: true,
      responsive: false,
      "sDom": 'rtip',
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
              { value: 0, label: 'En ettente', style: 'warning' },
              { value: 1, label: 'Envoyer', style: 'blue' },
              { value: 2, label: 'Rejetés', style: 'danger' },
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
                <li><button class="btn btn-danger btn-icon-only btn-circle btn-air remove-quotation" data-id="${row.ID}" ><i class="la la-trash"></i></button></li>
              </ul>
            </div>`
        }
      ],
      initComplete: (setting, json) => {
        $("#quotation-table tbody").on('click', '.edit-quotation', ev => {
          ev.preventDefault();
          let __quotation = getElementData(ev);
          this.router.navigate(['dashboard', 'quotation', __quotation.ID]);
        });

        $("#quotation-table tbody").on('click', '.remove-quotation', ev => {
          ev.preventDefault();
          let __quotation = getElementData(ev);
          // Vérifier le niveau d'accès
          if (this.security.hasAccess('s2')) {
            Swal.fire({
              title: "Confirmation",
              text: "Voulez vous vraiment supprimer ce demande?",
              type: 'warning',
              showCancelButton: true
            }).then(result => {
              if (result.value) {
                Helpers.setLoading(true);
                this.WPAPI.orders().id(__quotation.ID).delete({ force: true, reassign: 1 }).then(resp => {
                  Helpers.setLoading(false);
                  this.reload();
                  Swal.fire("Succès", "Client supprimer avec succès", 'success');
                });
              }
            });
          }

        });

        $('#quotation-table tbody').on('click', '.status-switcher', e => {
          e.preventDefault();
          let __quotation = getElementData(e);
          if (this.security.hasAccess('s3')) {
            Helpers.setLoading(true);
            this.WCAPI.get(`orders/${__quotation.ID}`, (err, data, res) => {
              let response: any = JSON.parse(res);
              this.qtSelected = _.clone(response);
              Helpers.setLoading(false);
              this.cd.detectChanges();
            });
          }

        });

        $('#quotation-switcher-modal').on('hide.bs.modal', e => {
          this.reload();
        });
      },
      ajax: {
        url: `${config.apiUrl}/quotations/`,
        dataType: 'json',
        data: (d) => {
          d.columns = false;
          d.order = false;
          d.position = _.isNull(this.queryPosition) || _.isEmpty(this.queryPosition) ? [0, 2] : this.queryPosition;
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
          if (response.code === "jwt_auth_invalid_token") {
            this.auth.logout();
            location.reload();
          }
        },
        type: 'POST',
      }

    });
  }

}
