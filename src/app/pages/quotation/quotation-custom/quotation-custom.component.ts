import { Component, OnInit, Output, ChangeDetectorRef, EventEmitter, Input, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { FzSecurityService } from '../../../_services/fz-security.service';
import { Router } from '@angular/router';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';
import * as moment from 'moment';
import * as _ from 'lodash';
import { config } from '../../../../environments/environment';
import { Helpers } from '../../../helpers';
import Swal from 'sweetalert2';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
declare var $: any;

@Component({
  selector: 'app-quotation-custom',
  templateUrl: './quotation-custom.component.html',
  styleUrls: ['./quotation-custom.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class QuotationCustomComponent implements OnInit, AfterViewInit {

  public Table: any = null;
  public queryPosition: any;
  public _qRefresh: any;
  private Woocommerce;
  private Wordpress;

  @Output() selectQt = new EventEmitter<any>();
  @Input() Balise: string = '';
  @Input() Position: any = 0;
  @Input() Role: string = '';

  @Input()
  set refresh(val: any) {
    this._qRefresh = _.clone(val);
    if (!_.isNull(this.Table)) {
      console.log(val);
    }

  }

  get refresh(): any { return this._qRefresh; }

  constructor(
    private security: FzSecurityService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private apiWC: ApiWoocommerceService,
    private apiWP: ApiWordpressService
  ) {
    this.Woocommerce = this.apiWC.getWoocommerce();
    this.Wordpress = this.apiWP.getWordpress();
  }

  public reload(): void {
    this.Table.ajax.reload(null, false);
  }

  ngOnInit() {
    moment.locale('fr');

  }

  getRowElement(ev: any): any {
    let el = $(ev.currentTarget).parents('tr');
    let data = this.Table.row(el).data();
    return data
  }

  ngAfterViewInit() {
    const quotationTable = $(`#quotation-${this.Balise}-table`);
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
            if (!_.isObjectLike(data)) return 'Client introuvable';
            let name = _.isEmpty(data.company_name) || _.isNull(data.company_name) ? data.last_name + ' ' + data.first_name : data.company_name;
            return `<span class="view-client">${name}</span>`
          }
        },
        {
          data: 'position', render: (data, type, row) => {
            const Status: Array<any> = [
              { value: 0, label: 'En ettente', style: 'warning' },
              { value: 1, label: 'Envoyer', style: 'blue' },
              { value: 2, label: 'Rejeté',  style: 'danger' },
              { value: 3, label: 'Accepté', style: 'success' },
              { value: 4, label: 'Terminé', style: 'success' },
            ];
            let position: any = _.find(Status, { value: data });
            if (_.isUndefined(position)) return 'Non definie';
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

        $(`#quotation-${this.Balise}-table tbody`).on('click', '.edit-quotation', ev => {
          ev.preventDefault();
          let __quotation = this.getRowElement(ev);
          this.router.navigate(['dashboard', 'quotation', __quotation.ID]);
        });

        $(`#quotation-${this.Balise}-table tbody`).on('click', '.view-client', ev => {
          ev.preventDefault();
          let __quotation = this.getRowElement(ev);
          this.router.navigate(['client', __quotation.user_id, 'edit']);
        });

        $(`#quotation-${this.Balise}-table tbody`).on('click', '.status-switcher', e => {
          e.preventDefault();
          let __quotation = this.getRowElement(e);
          if (this.security.hasAccess('s3')) {
            Helpers.setLoading(true);
            this.Woocommerce.get(`orders/${__quotation.ID}`, (err, data, res) => {
              Helpers.setLoading(false);
              let response: any = JSON.parse(res);
              this.selectQt.emit(response);

              this.cd.detectChanges();
            });
          }
        });

        $(`#quotation-${this.Balise}-table tbody`).on('click', '.remove-quotation', ev => {
          ev.preventDefault();
          let __quotation = this.getRowElement(ev);
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
                this.Wordpress.orders().id(__quotation.ID).delete({ force: true, reassign: 1 }).then(resp => {
                  Helpers.setLoading(false);
                  this.reload();
                  Swal.fire("Succès", "Demande supprimer avec succès", 'success');
                });
              }
            });
          }
        });
      },
      ajax: {
        url: `${config.apiUrl}/quotations/`,
        dataType: 'json',
        data: (d) => {
          d.position = this.Position; // int or array of int
          d.role = this.Role;
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
        error: (jqXHR, textStatus, errorThrow) => {
          let response: any = jqXHR.responseJSON;
        },
        type: 'POST',
      }

    });
  }

}
