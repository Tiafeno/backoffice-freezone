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
import RSVP from 'rsvp';
declare var $: any;

@Component({
  selector: 'app-sav',
  templateUrl: './sav.component.html',
  styleUrls: ['./sav.component.css']
})
export class SavComponent implements OnInit {
  public Table: any;
  private Wordpress: any;
  private messages: Array<{ status: number, msg: string }> = [
    { status: 1, msg: "Bonjour,\n Nous vous informons que votre matériel a été bien diagnostique, de ce fait le service clientèle vas vous contacter pour la suite \n\n Merci \n\n SAV  Freezone " },
    { status: 2, msg: "Bonjour,\n Nous vous informons que votre matériel n’a pas pu être diagnostique, de ce fait le service clientèle vas vous contacter pour la suite \n\n Merci \n\n SAV  Freezone " },
    { status: 3, msg: "Bonjour,\n Nous vous informons que votre matériel est déjà en réparation et actuellement en atelier sous nos soins avec les techniciens \n\n Merci\n\n SAV  Freezone " },
    { status: 4, msg: "" },
    { status: 5, msg: "Bonjour,\n Nous vous informons que la réparation de votre matériel est terminée, ainsi le service clientèle vas vous contacter pour la suite \n\n Merci \n\n SAV  Freezone " },
    {
      status: 6, msg: "Bonjour,\n Nous avons bien réceptionné votre matériel et la procédure avant diagnostique est de vous faire parvenir " +
        "l’inventaire des objets qu’on a réceptionné suivant cette liste :\n\n Merci\n\n SAV  Freezone "
    },
  ];
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

    if ($.fn.dataTable.isDataTable('#sav-table')) {
      this.Table.destroy();
    }

    this.Table = $('#sav-table').DataTable({
      pageLength: 10,
      page: 1,
      ordering: false, // Activer ou désactiver l'affichage d'ordre
      fixedHeader: true,
      responsive: false,
      "sDom": 'rtip',
      processing: true,
      serverSide: true,
      columns: [
        { data: 'id', render: (data) => { return `n°${data}` } },
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
          // Date de reception du materiel
          data: 'date_receipt', render: data => {
            let receiptMoment = moment(data);
            if (!receiptMoment.isValid()) return `<span class="badge badge-pink add-receipt-date">Non definie</span>`;
            return moment(data).format('LLL');
          }
        },
        {
          // Date de sortie de l'atelier
          data: 'date_release', render: (data, type, row) => {
            let dt = '';
            dt = !_.isEmpty(data) ? moment(data).format('LL') : "Non assigné";
            return `<span class="badge badge-default change-release-date" style="cursor: pointer">${dt}</span>`;
          }
        },
        {
          data: 'status_sav', render: (data, type, row) => {
            let dt = _.isObject(data) ? data.label : 'Non definie';
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
        $('#sav-table tbody').on('click', '.add-receipt-date', ev => {
          ev.preventDefault();
        });
        $('#sav-table tbody').on('click', '.change-status', async ev => {
          ev.preventDefault();
          this.changeStatus(ev);
        });
        $('#sav-table tbody').on('click', '.change-release-date', ev => {
          ev.preventDefault();
          this.changeReleaseDate(ev);
        });
        // Supprimer une service
        $('#sav-table tbody').on('click', '.remove-sav', ev => {
          ev.preventDefault();
          this.removeSav(ev);
        });
        // Modifier une service
        $('#sav-table tbody').on('click', '.edit-sav', ev => {
          ev.preventDefault();
          const el: any = $(ev.currentTarget).parents('tr');
          const data: any = this.Table.row(el).data();
          this.zone.run(() => { this.router.navigate(['/sav', data.id, 'edit']) });
        });
        // Envoyer un email
        $('#sav-table tbody').on('click', '.mail-sav', ev => {
          ev.preventDefault();
          const el: any = $(ev.currentTarget).parents('tr');
          const data: any = this.Table.row(el).data();
          this.zone.run(() => { this.router.navigate(['/sav', data.id, 'mail']) });
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

  private async changeReleaseDate(ev: MouseEvent) {
    if (!this.security.hasAccess('s16', true)) return false;
    const el: any = $(ev.currentTarget).parents('tr');
    const data: any = this.Table.row(el).data();
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
  }

  private removeSav(ev: MouseEvent) {
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
        this.Wordpress.savs().id(data.id).delete({ force: true }).then(resp => {
          Helpers.setLoading(false);
          this.reload();
        }, err => { 
          Helpers.setLoading(false);
          Swal.fire('', err.message, 'error');
        });
      }
    });
  }

  // Modifier le status du SAV
  private changeStatus(ev: MouseEvent) {
    if (!this.security.hasAccess('s15', true)) {
      return false;
    }
    const el: any = $(ev.currentTarget).parents('tr');
    const __DATA__: any = this.Table.row(el).data();
    const __STATUS__ = {
      '0': 'Aucun',
      '1': '1 - Diagnostique en cours',
      '2': '2 - Diagnostique fini',
      '3': '3 - Réparation accordée',
      '4': '4 - Réparation refusée',
      '5': '5 - Produit récupéré par le client'
    };
    let statusValue = _.isObjectLike(__DATA__.status_sav) ? __DATA__.status_sav.value : '';
    statusValue = _.isEqual(statusValue, '') ? '0' : statusValue; // Diagnostic non réalisé par default
    Swal.mixin({
      confirmButtonText: 'Suivant &rarr;',
      cancelButtonText: 'Annuler',
      showCancelButton: true,
      progressSteps: ['1', '2']
    }).queue([
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
            if (_.isEqual(value, '') || _.isEqual(value, '0')) {
              Swal.showValidationMessage("Ce champ est requis");
            }
            resolve(value);
          });
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
          return new Promise((resolve) => {
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
            }
            resolve(msg);
          }) // .end promise
        },
        inputValue: ""
      }
    ]).then((result) => {
      if (result.value) {
        const Response = result.value;
        const dataOnlineUser = this.auth.getCurrentUser().data;
        const subject = '';
        const message = Response[1];
        const args: any = {
          status: 'draft',
          title: subject,
          content: message,
          attach_post: __DATA__.id,
          sav_status: parseInt(Response[0]),
          sender: dataOnlineUser.ID,
          response_post: 0
        };
        const updateSav = this.Wordpress.savs().id(__DATA__.id).update({ status_sav: parseInt(Response[0]) });
        const createPostMail = this.Wordpress.mailing().create(args);
        RSVP.all([updateSav, createPostMail]).then(rsvpResult => {
          const mailingId = rsvpResult[1].id;
          const Form: FormData = new FormData();
          Form.append('sender', dataOnlineUser.ID.toString());
          Form.append('sav_id', __DATA__.id.toString());
          Form.append('subject', subject);
          Form.append('message', message);
          Form.append('mailing_id', mailingId.toString());
          // Envoyer le mail
          this.Http.post<any>(`${config.apiUrl}/mail/sav/${__DATA__.id}`, Form).subscribe(mailResp => {
            Swal.fire({
              title: 'Succès!',
              html: "Modification apporté avec succès",
              confirmButtonText: 'OK'
            }).then(successResp => {
              this.reload();
            });
          }, err => {
            Swal.fire("", "Une erreur s'est produit pendant l'envoie", 'error');
          })
        });
      }
    })
  }

}
