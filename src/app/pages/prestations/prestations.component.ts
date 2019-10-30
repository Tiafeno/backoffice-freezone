import { Component, OnInit, AfterViewInit } from '@angular/core';
import * as _ from 'lodash';
import { ApiWordpressService } from '../../_services/api-wordpress.service';
import { FzServicesService } from '../../_services/fz-services.service';
import { config } from '../../../environments/environment';
import Swal from 'sweetalert2';
import { Helpers } from '../../helpers';
import { nearer } from 'q';
declare var $: any;

@Component({
    selector: 'app-prestations',
    templateUrl: './prestations.component.html',
    styleUrls: ['./prestations.component.css']
})
export class PrestationsComponent implements OnInit, AfterViewInit {
    public table: any;
    public categories: Array<{ key: number, name: string }> = [
        { key: 1, name: "PC" },
        { key: 2, name: "Laptop" },
        { key: 3, name: "Tous les plates-formes" }
    ];
    private wordpress: any;
    constructor(
        private services: FzServicesService,
        private apiWP: ApiWordpressService
    ) {
        this.wordpress = this.apiWP.getWordpress();
    }

    ngOnInit() {
    }

    ngAfterViewInit() {
        if ($.fn.dataTable.isDataTable('#categories-table')) {
            this.table.destroy();
        }

        this.table = $('#categories-table').DataTable({
            pageLength: 20,
            page: 1,
            ordering: false, // Activer ou désactiver l'affichage d'ordre
            fixedHeader: true,
            responsive: false,
            processing: true,
            serverSide: true,
            sDom: 'rtip',
            language: {
                url: "https://cdn.datatables.net/plug-ins/1.10.16/i18n/French.json"
            },
            columns: [
                { data: 'title.rendered' },
                {
                    data: 'ctg_platform', render: (data) => {
                        let key: any = parseInt(data, 10);
                        if (_.isNaN(key)) return 'Aucun';
                        return _.find(this.categories, { key: key }).name;
                    }
                },
                {
                    data: 'ctg_price', render: (data) => {
                        let price: string = this.services.currencyFormat(parseInt(data));
                        return `<span class="badge badge-info">${price}</span>`
                    }
                },
                {
                    data: 'ctg_observation', render: (data) => {
                        return _.isEmpty(data) || _.isNull(data) || _.isEqual(data, 'null') ? 'Aucun' : data;
                    }
                },
                {
                    data: null, render: (data) => {
                        return `
            <a class="font-16 ml-3 remove-catalog" data-toggle="tooltip" data-placement="top" title="Supprimer"><i class="ti-trash"></i></a>
            `;
                    }
                }
            ],
            initComplete: () => {

                // Supprimer un catalogue
                $('#categories-table tbody').on('click', '.remove-catalog', ev => {
                    ev.preventDefault();
                    let el = $(ev.currentTarget).parents('tr');
                    let data = this.table.row(el).data();
                    this.removeCategorie(data.id);
                });

            },
            ajax: {
                url: `${config.apiUrl}/catalog/`,
                dataSrc: function (json) {
                    return json.data;
                },
                data: (d) => {
                    let length = _.clone(d.length);
                    let start = _.clone(d.start);

                    let query: any = {};
                    query.per_page = length;
                    query.offset = start;
                    return query;
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

    public removeCategorie(ctgId: number): any {
        if (!_.isNumber(ctgId)) return false;
        Swal.fire({
            title: 'Confirmation',
            html: `Voulez vous vraiment supprimer cette categorie?`,
            type: 'warning',
            showCancelButton: true
          }).then(result => {
            if (result.value) {
              Helpers.setLoading(true);
              this.wordpress.catalog().id(ctgId).delete({force: true}).then(resp => {
                Helpers.setLoading(false);
                this.ngAfterViewInit();
                Swal.fire('Succès', "Supprimer avec succès", 'success');
              }).catch(err => {
                Swal.fire('Désolé', 'Une erreur s\'est produit pendant la suppression', 'error');
                Helpers.setLoading(false);
              });
            }
          });
    }

    public newCategorie() {
        Swal.mixin({
            confirmButtonText: 'Suivant &rarr;',
            cancelButtonText: 'Annuler',
            showCancelButton: true,
            progressSteps: ['1', '2', '3', '4']
        }).queue([
            {
                input: 'text',
                title: 'Designation du prestation',
                text: 'Veuillez ajouter une designation',
                inputValidator: (value) => {
                    return new Promise((resolve, reject) => {
                        if (_.isEmpty(value)) {
                            resolve('Ce champ est obligatoire');
                        }

                        resolve();
                    });
                },
                allowOutsideClick: () => !Swal.isLoading(),
            },
            // Designation
            {
                input: 'select',
                inputPlaceholder: 'Selectionnez',
                inputValue: "3",
                inputOptions: {
                    "3": "PC / Laptop",
                    "2": "Laptop",
                    "1": "PC",
                    "": "Aucun"
                },
                title: 'Plats-formes',
                text: 'Ajouter un plate-formes si nécessaire',
                showLoaderOnConfirm: true,
                allowOutsideClick: () => !Swal.isLoading(),
            },
            // plate-forme
            {
                input: 'number',
                title: 'Tarif',
                text: 'Veuillez ajouter un tarif',
                inputValidator: (value) => {
                    return new Promise((resolve, reject) => {
                        if (_.isEmpty(value)) {
                            resolve('Ce champ est obligatoire');
                        }

                        resolve();
                    });
                },
                allowOutsideClick: () => !Swal.isLoading(),
            }, // Prix
            {
                input: 'text',
                title: 'Observation',
                text: '',
                inputValidator: (value) => {
                    return new Promise((resolve, reject) => {
                        if (_.isEmpty(value)) {
                            resolve('Ce champ est obligatoire');
                        }

                        resolve();
                    });
                },
                allowOutsideClick: () => !Swal.isLoading(),
            }, // Observation
        ]).then((result) => {
            if (result.value) {
                const Value: Array<any> = _.clone(result.value);
                if (_.isEmpty(Value)) return false;
                const name = Value[0];
                const platform = Value[1];
                const price = Value[2];
                const observation = Value[3];

                const args = {
                    ctg_platform: platform,
                    ctg_price: _.isNaN(parseInt(price, 10)) ? 0 : parseInt(price, 10),
                    ctg_observation: observation,

                    title: name,
                    status: 'publish'
                };
                this.addCatalog(args);
            }
        })
    }

    private addCatalog(args: any) {
        Helpers.setLoading(true);
        this.wordpress.catalog().create(args).then(resp => {
            Helpers.setLoading(false);
            this.ngAfterViewInit();
        }); 
    }

}
