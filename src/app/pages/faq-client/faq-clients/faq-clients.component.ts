import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';
import Swal from 'sweetalert2';
import { Helpers } from '../../../helpers';
import { Router } from '@angular/router';
import { config } from '../../../../environments/environment';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
declare var $: any;

@Component({
  selector: 'app-faq-clients',
  templateUrl: './faq-clients.component.html',
  styleUrls: ['./faq-clients.component.css']
})
export class FaqClientsComponent implements OnInit {
  private Table;
  private Wordpress;

  constructor(
    private router: Router,
    private apiWP: ApiWordpressService
  ) {
    this.Wordpress = this.apiWP.getWordpress();
  }

  public reload() {
    this.Table.ajax.reload(null, false);
  }

  ngOnInit() {
    moment.locale('fr');

    const getElementData = (ev: any): any => {
      const el = $(ev.currentTarget).parents('tr');
      const data = this.Table.row(el).data();
      return data;
    };

    const faqTable = $('#client-faq-table');
    this.Table = faqTable.DataTable({
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
          data: 'title', render: (data, type, row) => {
            return `<span class="edit-faq font-strong">${data.rendered}</span>`;
          }
        },
        {
          data: 'faq_category', render: (data, type, row) => {
            const categories: Array<any> = [
              { label: 'Professionnel', value: 1 },
              { label: 'Particulier', value: 2 },
            ]
            return _.isEmpty(data) ? 'Non définie' : _.find(categories, {value: parseInt(data, 10)} as any).label;
          }
        },
        {
          data: 'date', render: (data) => {
            return moment(data).format('LLL');
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
                      <li><button class="btn btn-primary btn-icon-only btn-circle btn-air edit-faq"><i class="la la-edit"></i></button></li>
                      <li><button class="btn btn-danger btn-icon-only btn-circle btn-air remove-faq"><i class="la la-trash"></i></button></li>
                   </ul>
                </div>`
        }
      ],
      initComplete: (setting, json) => {
        $('#client-faq-table tbody').on('click', '.remove-faq', ev => {
          ev.preventDefault();
          Swal.fire({
            title: 'Confirmation',
            text: 'Voulez vous vraiment supprimer ce article FAQ?',
            type: 'warning',
            showCancelButton: true
          }).then(result => {
            if (result.value) {
              Helpers.setLoading(true);
              const __faq: any = getElementData(ev);
              const faqID: number = parseInt(__faq.id, 10);
              this.Wordpress.faq_client().id(faqID).delete({ force: true }).then(faq => {
                Helpers.setLoading(false);
                this.reload();
                Swal.fire('Succès', "Article FAQ supprimer avec succès", 'success');
              })
            }
          });
        });

        $('#client-faq-table tbody').on('click', '.edit-faq', e => {
          e.preventDefault();
          const __faq: any = getElementData(e);
          this.router.navigate(['/faq-client', __faq.id]);
        });

      },
      ajax: {
        url: `${config.apiUrl}/faq-client/`,
        dataType: 'json',
        data: {
          order: false,
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
