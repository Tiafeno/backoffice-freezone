import { Component, OnInit, NgZone } from '@angular/core';
import { config } from '../../../../environments/environment';
import * as moment from 'moment';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import { Helpers } from '../../../helpers';
import { Router } from '@angular/router';
import { FzSecurityService } from '../../../_services/fz-security.service';
declare var $: any;

@Component({
  selector: 'app-sav',
  templateUrl: './sav.component.html',
  styleUrls: ['./sav.component.css']
})
export class SavComponent implements OnInit {
  public Table: any;
  private Wordpress: any;
  constructor(
    private apiWP: ApiWordpressService,
    private zone: NgZone,
    private router: Router,
    private security: FzSecurityService
  ) {
    this.Wordpress = this.apiWP.getWordpress();
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
        { data: 'ID', render: (data) => { return `n°${data}` } },
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
          data: 'approximate_time', render: (data, type, row) => {
            let dt = '';
            dt = !_.isEmpty(data) ? moment(data).format('LL') : "Non assigné";
            return `<span class="badge badge-default change-approximate-time">${dt}</span>`;
          }
        },
        {
          data: 'status_sav', render: (data, type, row) => {
            let dt = _.isObject(data) ? data.label : 'Non assigné';
            return `<span class="badge badge-default change-status">${dt}</span>`;
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
                <li><button class="btn btn-success btn-icon-only btn-circle btn-air mail-sav" data-id="${row.ID}"><i class="la la-envelope"></i></button></li>
                <li><button class="btn btn-primary btn-icon-only btn-circle btn-air edit-sav" data-id="${row.ID}"><i class="la la-edit"></i></button></li>
                <li><button class="btn btn-danger btn-icon-only btn-circle btn-air remove-sav" data-id="${row.ID}" ><i class="la la-trash"></i></button></li>
              </ul>
            </div>`
        }
      ],
      initComplete: (setting, json) => {

        $('#sav-table tbody').on('click', '.change-status', async ev => {
          ev.preventDefault();
          if ( ! this.security.hasAccess('s15', true)) {
            return false;
          }
          const data: any = getElementData(ev);
          let status = _.isObject(data.status_sav) ? data.status_sav.value : '';
          status = _.isEmpty(status) ? '2' : status;
          const { value: currentStatus } = await Swal.fire({
            title: 'Modifier le statut',
            input: 'select',
            inputOptions: {
              '1': '1 - Diagnostic réalisé',
              '2': '2 - Diagnostic non réalisé',
              '3': '3 - A réparer',
              '4': '4 - Ne pas réparer',
              '5': '5 - Terminer'
            },
            inputPlaceholder: 'Select a status',
            showCancelButton: true,
            confirmButtonText: 'Enregister',
            cancelButtonText: 'Annuler',
            inputValue: status,
            inputValidator: (value) => {
              return new Promise(resolve => {
                if (_.isEmpty(value)) {
                  resolve("Ce champ est requis");
                  return;
                }
                this.Wordpress.savs().id(data.ID).update({
                  status_sav: value
                }).then(resp => {
                  resolve();
                }).catch(err => { resolve(err); });
              });
            }
          })

          if (currentStatus) {
            Swal.fire("Statut mis à jour avec succès");
            this.reload();
          }
        });

        $('#sav-table tbody').on('click', '.change-approximate-time', async ev => {
          ev.preventDefault();
          const data: any = getElementData(ev);
          let approximateTime: any = moment(data.approximate_time);
          let inputDateValue = '';
          const dateNow: any = moment();
          if (approximateTime.isValid()) {
            inputDateValue = approximateTime.format('DD-MM-YYYY');
            if (dateNow <= approximateTime) {
              Swal.fire('Désolé', "Vous ne pouvez pas modifier la date avant la date d'expiration", 'warning');
              return false;
            }
          }
          const { value: dateApproximate } = await Swal.fire({
            title: 'Ajouter une date',
            input: 'text',
            inputValue: inputDateValue,
            showCancelButton: true,
            confirmButtonText: 'Enregister',
            cancelButtonText: 'Annuler',
            inputPlaceholder: 'jj-mm-aaaa',
            inputValidator: (value) => {
              return new Promise(resolve => {
                if (!value) {
                  resolve('You need to write something!')
                  return;
                }
                const isMoment  =  moment(value, 'DD-MM-YYYY');
                if ( ! isMoment.isValid()) {
                  resolve("Veuillez remplir le champ correctement");
                  return;
                }
                const hasMoment = isMoment.format('YYYY-MM-DD');
                this.Wordpress.savs().id(data.ID).update({
                  approximate_time: hasMoment
                }).then(resp => { resolve(); })
                  .catch(err => { resolve(err); });
              });
            }
          })

          if (dateApproximate) {
            Swal.fire(`Nouvelle date: ${dateApproximate}`);
            this.reload();
          }
        });

        // Supprimer une service
        $('#sav-table tbody').on('click', '.remove-sav', ev => {
          ev.preventDefault();
          const element = $(ev.currentTarget);
          const elData: any = $(element).data();
          Swal.fire({
            title: 'Confirmation',
            html: `Voulez vous vraiment supprimer cette post?`,
            type: 'warning',
            showCancelButton: true
          }).then(result => {
            if (result.value) {
              Helpers.setLoading(true);
              this.Wordpress.savs().id(elData.id).delete({ force: true }).then(resp => {
                Helpers.setLoading(false);
                this.reload();
              });
            }
          });
        });

        $('#sav-table tbody').on('click', '.edit-sav', ev => {
          ev.preventDefault();
          const element = $(ev.currentTarget);
          const elData: any = $(element).data();
          this.zone.run(() => { this.router.navigate(['/sav', elData.id, 'edit']) });
        });

        $('#sav-table tbody').on('click', '.mail-sav', ev => {
          ev.preventDefault();
          const element = $(ev.currentTarget);
          const elData: any = $(element).data();
          this.zone.run(() => { this.router.navigate(['/sav', elData.id, 'mail']) });
        });

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
