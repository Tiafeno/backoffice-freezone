import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { config } from '../../../../environments/environment';
import * as moment from 'moment';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import { Helpers } from '../../../helpers';
import { Router } from '@angular/router';
import { FzSecurityService } from '../../../_services/fz-security.service';
import { HttpClient } from '@angular/common/http';
import { AuthorizationService } from '../../../_services/authorization.service';
import { MSG } from '../../../defined';
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
    private Http: HttpClient,
    private auth: AuthorizationService,
    private security: FzSecurityService,
    private cd: ChangeDetectorRef,
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
            return `<span class="badge badge-default change-approximate-time" style="cursor: pointer">${dt}</span>`;
          }
        },
        {
          data: 'status_sav', render: (data, type, row) => {
            let dt = _.isObject(data) ? data.label : 'Diagnostic non réalisé';
            return `<span class="badge badge-default change-status" style="cursor: pointer">${dt}</span>`;
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
          if (!this.security.hasAccess('s15', true)) {
            return false;
          }
          const __DATA__: any = getElementData(ev);
          const __STATUS__ = {
            '1': '1 - Diagnostic réalisé',
            '2': '2 - Diagnostic non réalisé',
            '3': '3 - A réparer',
            '4': '4 - Ne pas réparer',
            '5': '5 - Terminer'
          };
          let statusValue = _.isObjectLike(__DATA__.status_sav) ? __DATA__.status_sav.value : '';
          statusValue = _.isEqual(statusValue, '') ? '2' : statusValue; // Diagnostic non réalisé par default
          let mailSubject = null; // Contient l'objet du mail
          let mailStatus = null;
          Swal.mixin({
            confirmButtonText: 'Suivant &rarr;',
            cancelButtonText: 'Annuler',
            showCancelButton: true,
            progressSteps: ['1', '2', '3']
          }).queue([
            {
              input: 'text',
              title: 'Objet de cette changement',
              text: 'Veuillez ajouter une objet pour cette modification',
              inputValidator: (value) => {
                return new Promise((resolve, reject) => {
                  if (_.isEmpty(value)) {
                    resolve('Ce champ est obligatoire');
                  }

                  resolve();
                });
              },
              allowOutsideClick: () => !Swal.isLoading(),
              preConfirm: (value) => {
                return new Promise(resolve => {
                  mailSubject = value;
                  resolve(true);
                })
              }
            },
            // Statut
            {
              input: 'select',
              inputPlaceholder: 'Selectionnez un statut',
              inputValue: statusValue,
              inputOptions: __STATUS__,
              title: 'Statut du S.A.V',
              text: 'Changer le statut',
              showLoaderOnConfirm: true,
              allowOutsideClick: () => !Swal.isLoading(),
              preConfirm: (value) => {
                return new Promise((resolve, reject) => {
                  if (_.isEqual(value, '')) {
                    Swal.showValidationMessage("Ce champ est requis");
                    resolve(false);
                  }
                  mailStatus = parseInt(value, 10);
                  // Envoyer une requete pour modifier la statut
                  this.Wordpress.savs().id(__DATA__.ID).update({
                    status_sav: value
                  }).then(resp => {
                      resolve(true);

                    }).catch(err => {
                      Swal.showValidationMessage(err);
                      resolve(false);
                    });
                  this.cd.detectChanges();
                })

              }
            },
            // Message pour l'email
            {
              title: 'Message',
              text: 'Envoyer un message pour le client',
              input: 'textarea',
              inputPlaceholder: 'Ecrivez votre message ici...',
              inputAttributes: {
                'aria-label': 'Ecrivez votre message ici...'
              },
              confirmButtonText: 'Enregistrer & Envoyer',
              inputValidator: (value) => {
                return new Promise((resolve, reject) => {
                  if (_.isEmpty(value)) { resolve('Ce champ est obligatoire'); }
                  resolve();
                });
              },
              showLoaderOnConfirm: true,
              allowOutsideClick: () => !Swal.isLoading(),
              preConfirm: (msg) => {
                return new Promise((resolve, reject) => {
                  if (_.isEqual(msg, '')) {
                    Swal.showValidationMessage("Ce champ est requis");
                    resolve(false);
                  }
                  const dataOnlineUser = this.auth.getCurrentUser().data;
                  const subject = mailSubject;
                  const message = msg;

                  const args: any = {
                    status: 'draft',
                    title: subject,
                    content: message,
                    attach_post: __DATA__.ID,
                    sav_status: mailStatus,
                    sender: dataOnlineUser.ID,
                    response_post: 0
                  };
                  this.Wordpress.mailing().create(args).then(resp => {
                    const Form: FormData = new FormData();
                    Form.append('sender', dataOnlineUser.ID.toString());
                    Form.append('sav_id', __DATA__.ID.toString());
                    Form.append('subject', subject);
                    Form.append('message', message);
                    Form.append('mailing_id', resp.id.toString());
                    // Envoyer le mail
                    this.Http.post<any>(`${config.apiUrl}/mail/sav/${__DATA__.ID}`, Form).subscribe(resp => {
                      resolve(true);
                    }, err => {
                      Swal.showValidationMessage("Une erreur s'est produit pendant l'envoie");
                      resolve(false);
                    });

                    this.cd.detectChanges();

                  }).catch(err => {
                    Swal.showValidationMessage(err);
                    resolve(false);
                  });
                }) // .end promise

              }
            }
          ]).then((result) => {
            if (result.value) {
              Swal.fire({
                title: 'Succès!',
                html: "Modification apporté avec succès",
                confirmButtonText: 'OK'
              }).then(successResp => {
                this.reload();
              });

            }
          })

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
                const isMoment = moment(value, 'DD-MM-YYYY');
                if (!isMoment.isValid()) {
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
          if (!this.auth.isAdministrator()) {
            Swal.fire(MSG.ACCESS.DENIED_TTL, MSG.ACCESS.DENIED_CTT, 'warning');
            return false;
          }
          const el: any = $(ev.currentTarget).parents('tr');
          const data: any = this.Table.row(el).data();
          Swal.fire({
            title: 'Confirmation',
            html: `Voulez vous vraiment supprimer cette post?`,
            type: 'warning',
            showCancelButton: true
          }).then(result => {
            if (result.value) {
              Helpers.setLoading(true);
              this.Wordpress.savs().id(data.ID).delete({ force: true }).then(resp => {
                Helpers.setLoading(false);
                this.reload();
              });
            }
          });
        });

        // Modifier une service
        $('#sav-table tbody').on('click', '.edit-sav', ev => {
          ev.preventDefault();
          const el: any = $(ev.currentTarget).parents('tr');
          const data: any = this.Table.row(el).data();
          this.zone.run(() => { this.router.navigate(['/sav', data.ID, 'edit']) });
        });

        // Envoyer un email
        $('#sav-table tbody').on('click', '.mail-sav', ev => {
          ev.preventDefault();
          const el: any = $(ev.currentTarget).parents('tr');
          const data: any = this.Table.row(el).data();
          this.zone.run(() => { this.router.navigate(['/sav', data.ID, 'mail']) });
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
