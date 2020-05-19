import { Component, OnInit, Input, ChangeDetectorRef, NgZone } from '@angular/core';
import * as _ from 'lodash';
import { ApiWordpressService } from '../../_services/api-wordpress.service';
import * as WPAPI from 'wpapi';
declare var $: any;
import * as moment from 'moment';
import { SAV } from '../../sav';
import { Router } from '@angular/router';
import { Helpers } from '../../helpers';
import { FzSecurityService } from '../../_services/fz-security.service';
import Swal from 'sweetalert2';
import { AuthorizationService } from '../../_services/authorization.service';
import { MSG } from '../../defined';
import RSVP from 'rsvp';
import { config } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { FzServicesService } from '../../_services/fz-services.service';

@Component({
    selector: 'app-sav-datatable',
    templateUrl: './sav-datatable.component.html',
    styleUrls: ['./sav-datatable.component.css']
})
export class SavDatatableComponent implements OnInit {
    private perPage: number = 10;
    private wordpress: any;
    private _metaValue: Array<number> = [];
    private _metaCompare: string = "IN"; // Default value..
    @Input('meta_compare') set setCompare(value: string) {
        this._metaCompare = value;
        console.log(value);
    }
    @Input('meta_value') set stSav(value: Array<number>) {
        this._metaValue = value;
        this.initializeDataTable();
    }
    get getStatusValue(): Array<number> {
        return this._metaValue;
    }
    get getCompare(): string {
        return this._metaCompare;
    }
    public dataTableId: string = '';
    public Table: any;
    constructor(
        private wpapi: ApiWordpressService,
        private cd: ChangeDetectorRef,
        private zone: NgZone,
        private router: Router,
        private http: HttpClient,
        private security: FzSecurityService,
        private auth: AuthorizationService,
        private services: FzServicesService
    ) {
        this.wordpress = this.wpapi.getWordpress();
        // Generer une id pour la table
        this.dataTableId = Array(8).fill("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz").map(function (x) {
            return x[Math.floor(Math.random() * x.length)]
        }).join('');
    }

    ngOnInit() {
    }

    private getQuery(): WPAPI {
        return this.wordpress.savs().context("edit").perPage(this.perPage);
    }

    async initializeDataTable() {
        const currentLoggedUserId: number = this.auth.getCurrentUserId();
        const customersForCurrentCommercial = await this.services.getCustomersResponsible(currentLoggedUserId);
        let metaQuery = [];
        // https://codex.wordpress.org/Class_Reference/WP_Meta_Query
        metaQuery.push({
            key: 'status_sav',
            value: _.isEmpty(this.getStatusValue) ? '' : this.getStatusValue,
            compare: this.getCompare,
            // type: 'NUMERIC'
        });
        metaQuery['relation'] = 'AND';
        const request = this.getQuery().perPage(100).param('filter[meta_query]', Object.assign({}, metaQuery));
        Helpers.setLoading(true);
        request.then(responses => {
            Helpers.setLoading(false);
            var posts = _.clone(responses);
            var customerIds = []; // Contient tous les id utilisateurs gerer par le commercial
            customersForCurrentCommercial.subscribe(ids =>  customerIds = _.clone(ids));
            // Filtrer les resultats si l'utilisateur est un commercial
            if ( ! this.auth.isAdministrator()) {
                posts = _(posts).filter(post => _.indexOf(customerIds, post.id) > -1).value();
            }
            if (_.isArray(posts)) this.create(posts);
        }).catch(err => {
            console.error(err);
            Helpers.setLoading(false);
        });
    }

    public isAdmin() {
        return this.auth.isAdministrator();
    }

    private getDatatableList(ev: MouseEvent): any {
        const el: any = $(ev.currentTarget).parents('tr');
        return this.Table.row(el).data();
    }

    private create(posts: Array<SAV>) {
        if ($.fn.dataTable.isDataTable(`#${this.dataTableId}`)) {
            this.Table.destroy();
        }

        this.Table = $(`#${this.dataTableId}`).DataTable({
            pageLength: this.perPage,
            page: 1,
            ordering: false, // Activer ou désactiver l'affichage d'ordre
            fixedHeader: true,
            responsive: false,
            "sDom": 'rtip',
            data: posts,
            columns: [
                { data: 'id', render: (data) => { return `${data}` } },
                {
                    data: 'customer', render: (data, type, row) => {
                        if (_.isEmpty(data)) return "Non renseigner";
                        return `<span>${data.last_name} ${data.first_name}</span>`;
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
                    // Date de livraison de l'atelier
                    data: 'date_release', render: (data, type, row) => {
                        let dt = !_.isEmpty(data) || !_.isNull(data) ? moment(data).format('LL') : "Non assigné";
                        return `<span class="badge badge-default change-release-date" style="cursor: pointer">${dt}</span>`;
                    }
                },
                {
                    data: 'status_sav', render: (data, type, row) => {
                        let dt = _.isObjectLike(data) ? data.label : 'En cours de traitement';
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
                $(`#${this.dataTableId} tbody`).on('click', '.add-receipt-date', ev => {
                    ev.preventDefault();
                    this.updateReceiptDate(ev);
                });
                // Modifier le status
                $(`#${this.dataTableId} tbody`).on('click', '.change-status', ev => {
                    ev.preventDefault();
                    this.changeStatus(ev);
                });
                // Mettre a jour la date de sortie
                $(`#${this.dataTableId} tbody`).on('click', '.change-release-date', ev => {
                    ev.preventDefault();
                    this.changeReleaseDate(ev);
                });
                // Supprimer une service
                $(`#${this.dataTableId} tbody`).on('click', '.remove-sav', ev => {
                    ev.preventDefault();
                    this.removeSav(ev);
                });
                // Modifier une service
                $(`#${this.dataTableId} tbody`).on('click', '.edit-sav', ev => {
                    ev.preventDefault();
                    const el: any = $(ev.currentTarget).parents('tr');
                    const data: any = this.Table.row(el).data();
                    this.zone.run(() => { this.router.navigate(['/sav', data.id, 'edit']) });
                });
                // Envoyer un email
                $(`#${this.dataTableId} tbody`).on('click', '.mail-sav', ev => {
                    ev.preventDefault();
                    const el: any = $(ev.currentTarget).parents('tr');
                    const data: any = this.Table.row(el).data();
                    this.zone.run(() => { this.router.navigate(['/sav', data.id, 'mail']) });
                });
            }
        });
    }

    // Modifier la date de livraison du materiel dnas l'atelier
    // NB: Noté bien que cette date changeable une seul fois
    private async changeReleaseDate(ev: MouseEvent) {
        if (!this.security.hasAccess('s16', true)) return false;
        const data: any = this.getDatatableList(ev);
        let dateReleaseMoment: moment.Moment = moment(data.date_release);
        if (dateReleaseMoment.isValid()) { // Si une date est definie et aussi valide
            Swal.fire('Désolé', "Vous ne pouvez plus modifier cette date", 'warning');
            return false;
        }
        const { value: dateRelease } = await Swal.fire({
            title: 'Ajouter une date',
            input: 'text',
            inputValue: '',
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
                    this.wordpress.savs().id(data.ID).update({
                        date_release: hasMoment
                    }).then(resp => { resolve(); })
                        .catch(err => { resolve(err); });
                });
            }
        })
        if (dateRelease) {
            Swal.fire(`Nouvelle date: ${dateRelease}`);
            this.initializeDataTable();
        }
    }

    // Supprimer une post SAV
    private removeSav(ev: MouseEvent) {
        if (!this.auth.isAdministrator()) {
            Swal.fire(MSG.ACCESS.DENIED_TTL, MSG.ACCESS.DENIED_CTT, 'warning');
            return false;
        }
        const data: any = this.getDatatableList(ev);
        Swal.fire({
            title: 'Confirmation',
            html: `Voulez vous vraiment supprimer cette post?`,
            type: 'warning',
            showCancelButton: true
        }).then(result => {
            if (result.value) {
                Helpers.setLoading(true);
                this.wordpress.savs().id(data.id).delete({ force: true }).then(resp => {
                    Helpers.setLoading(false);
                    this.initializeDataTable();
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
            '0': 'En cours de traitement',
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
                const updateSav = this.wordpress.savs().id(__DATA__.id).update({ status_sav: parseInt(Response[0]) });
                const createPostMail = this.wordpress.mailing().create(args);
                Helpers.setLoading(true);
                RSVP.all([updateSav, createPostMail]).then(rsvpResult => {
                    const mailingId = rsvpResult[1].id;
                    const Form: FormData = new FormData();
                    Form.append('sender', dataOnlineUser.ID.toString());
                    Form.append('sav_id', __DATA__.id.toString());
                    Form.append('subject', subject);
                    Form.append('message', message);
                    Form.append('mailing_id', mailingId.toString());
                    // Envoyer le mail
                    this.http.post<any>(`${config.apiUrl}/mail/sav/${__DATA__.id}`, Form).subscribe(mailResp => {
                        Helpers.setLoading(false);
                        Swal.fire({
                            title: 'Succès!',
                            html: "Modification apporté avec succès",
                            confirmButtonText: 'OK'
                        }).then(successResp => {
                            this.initializeDataTable();
                        });
                    }, err => {
                        Helpers.setLoading(false);
                        Swal.fire("", "Une erreur s'est produit pendant l'envoie", 'error');
                    })
                });
            }
        })
    }

    private updateReceiptDate(ev: MouseEvent) {

    }

}
