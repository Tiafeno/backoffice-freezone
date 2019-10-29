import { Component, OnInit, AfterViewInit } from '@angular/core';
import * as _ from 'lodash';
import { ApiWordpressService } from '../../_services/api-wordpress.service';
import { FzServicesService } from '../../_services/fz-services.service';
import { config } from '../../../environments/environment';
declare var $: any;

@Component({
  selector: 'app-prestations',
  templateUrl: './prestations.component.html',
  styleUrls: ['./prestations.component.css']
})
export class PrestationsComponent implements OnInit, AfterViewInit {
  public table: any;
  public categories: Array<{key: number, name: string}> = [
    { key: 1, name: "PC" },
    { key: 2, name: "Laptop" },
    { key: 3, name: "Tous les plates-formes" }
  ];
  constructor(
    private services: FzServicesService
  ) { }

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
            return _.find(this.categories, {key: key}).name;
          }
        },
        {
          data: 'ctg_price', render: (data) => {
            let price: string = this.services.currencyFormat(parseInt(data));
            return `<span class="badge badge-info">${price}</span>`
          }
        },
        { data: 'ctg_observation', render: (data) => {
          return _.isEmpty(data) || _.isNull(data) ? 'Aucun' : data;
        } },
        {
          data: null, render: (data) => {
            return `
            <a class="font-16 edit-catalog" data-toggle="tooltip" data-placement="top" title="Modifier"><i class="ti-pencil-alt"></i></a>
            <a class="font-16 ml-3 remove-catalog" data-toggle="tooltip" data-placement="top" title="Supprimer"><i class="ti-trash"></i></a>
            `;
          }
        }
      ],
      initComplete: () => {
        
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

}
