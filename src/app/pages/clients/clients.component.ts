import {Component, OnInit, ViewChild, NgZone, ChangeDetectorRef} from '@angular/core';
import {ApiWordpressService} from "../../_services/api-wordpress.service";
import {config} from "../../../environments/environment";
import {Helpers} from "../../helpers";
import * as _ from 'lodash';
import * as moment from 'moment';
declare var $: any;
import {Router} from '@angular/router';
import {TypeClientSwitcherComponent} from "../../components/type-client-switcher/type-client-switcher.component";
import Swal from 'sweetalert2';
import { ApiWoocommerceService } from '../../_services/api-woocommerce.service';
import { FzSecurityService } from '../../_services/fz-security.service';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.css']
})
export class ClientsComponent implements OnInit {

  private WPAPI: any;
  private WCAPI: any;
  public Table: any;
  public Responsibles: Array<any> = [];
  public responsible: any = null;
  public responsibleLoading: boolean = false;

  @ViewChild(TypeClientSwitcherComponent) public SwitchType: TypeClientSwitcherComponent;
  constructor(
    private Security: FzSecurityService,
    private apiWp: ApiWordpressService,
    private apiWc: ApiWoocommerceService,
    private router: Router,
    private zone: NgZone,
    private cd: ChangeDetectorRef
  ) {
    this.WPAPI = this.apiWp.getWPAPI();
    this.WCAPI = this.apiWc.getWoocommerce();
  }

  public reload() {
    this.Table.ajax.reload(null, false);
  }

  private fnDeleteCustomer(customerid: number) {
    Helpers.setLoading(true);
    this.WCAPI.delete(`customers/${customerid}?force=true&reassing=1`, (err, data, res) => {
      const response: any = JSON.parse(res);
      Helpers.setLoading(false);
      this.reload();
      if (!_.isUndefined(response.code)) {
        Swal.fire('Désolé', response.message, 'error');
        return false;
      }
      Swal.fire('Succès', "Client supprimer avec succès", 'success');
    });
  }

  ngOnInit() {
    moment.locale('fr');

    const getElementData = (ev: any): any => {
      const el: any = $(ev.currentTarget).parents('tr');
      const data: any = this.Table.row(el).data();
      return data;
    };
    this.responsibleLoading = true;
    this.WPAPI.users().param('roles', 'editor').context('edit').then(resp => {
      this.Responsibles = _.clone(resp);
      this.responsibleLoading = false;
    });

    const productsTable = $('#clients-table');
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
          data: 'id', render: (data) => {
            return `<span>${data}</span>`;
          }
        },
        {
          data: 'first_name', render: (data, type, row) => {
            return `<span class="edit-product font-strong">${data} ${row.last_name}</span>`;
          }
        },
        {
          data: 'email', render: (data, type, row) => {
            return `<a href="mailto:${data}" target="_blank">${data}</span>`;
          }
        },
        {
          data: 'role', render: (data, type, row) => {
            // const companyStatus: any = _.find(data, {key : 'company_status'});
            // if (_.isUndefined(companyStatus)) return 'N/A';

            // const status: string = companyStatus.value == 'dealer' ? 'Revendeur' : (companyStatus.value == 'professional' ? 'Professionnel' : 'N/A');
            // const style: string = status === 'N/A' ? 'default' : (status === 'dealer' ? 'blue' : 'primary');
            // return `<span class="badge badge-${style} switch-type uppercase" style="cursor: pointer;">${status}</span>`;

            const role: any = _.isArray(data) ? data[0] : data;
            const status: string = role === 'fz-company' ? 'Entreprise' : 'Particulier';
            const style: string = role === 'fz-company' ? 'blue' : 'success';
            return `<span class="badge badge-${style} switch-type uppercase" style="cursor: pointer;">${status}</span>`;
          }
        },
        {
          data: 'date_created', render: (data) => {
            return moment(data).fromNow();
          }
        },
        {
          data: null,
          render: (data, type, row, meta) => {
            return `
                  <div class="fab fab-left">
                     <button class="btn btn-sm btn-primary btn-icon-only btn-circle btn-air" data-toggle="button">
                        <i class="fab-icon la la-bars"></i>
                        <i class="fab-icon-active la la-close"></i>
                     </button>
                     <ul class="fab-menu">
                      <li><button class="btn btn-primary btn-icon-only btn-circle btn-air edit-customer"><i class="la la-edit"></i></button></li>
                      <li><button class="btn btn-pink btn-icon-only btn-circle btn-air delete-customer"><i class="la la-trash"></i></button></li>
                     </ul>
                  </div>`;
          }
        }
      ],
      initComplete: (setting, json) => {
        // Modifier un client
        $('#clients-table tbody').on('click', '.edit-customer', e => {
          e.preventDefault();
          const __clt: any = getElementData(e);
          this.zone.run(() => { this.router.navigate(['/client', __clt.id, 'edit'])});
        });

        // Supprimer un client
        $('#clients-table tbody').on('click', '.delete-customer', e => {
          e.preventDefault();
          if (this.Security.hasAccess('s12', true)) {
            const __clt: any = getElementData(e);
            Swal.fire({
              title: 'Confirmation',
              html: `<b>Action non récommandé</b>. Voulez vous vraiment supprimer le client < <b>${__clt.email}</b> >?`,
              type: 'warning',
              showCancelButton: true
            }).then(result => {
              if (result.value) {
                this.fnDeleteCustomer(parseInt(__clt.id, 10));
              }
            });
          }
        });

        // Professionnel ou Revendeur
        $('#clients-table tbody').on('click', '.switch-type', e => {
          e.preventDefault();
          if (this.Security.hasAccess('s11', true)) {
            const __clt: any = getElementData(e);
            this.SwitchType.fnOpen(__clt);
          }
        });
      },
      ajax: {
        url: `${config.apiUrl}/clients/`,
        dataType: 'json',
        data: (data) => {
          return {
            responsible: !_.isNull(this.responsible) ? this.responsible : null,
            order: false,
            length: data.length,
            start: data.start
          }
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
