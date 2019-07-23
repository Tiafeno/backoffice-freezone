import { Component, OnInit, ViewChild } from '@angular/core';
import * as moment from 'moment';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { config } from '../../../../../environments/environment';
import { Helpers } from '../../../../helpers';
import { ApiWordpressService } from '../../../../_services/api-wordpress.service';
import { EditArticleComponent } from '../edit-article/edit-article.component';
declare var $: any;

@Component({
  selector: 'app-review-articles',
  templateUrl: './review-articles.component.html',
  styleUrls: ['./review-articles.component.css']
})
export class ReviewArticlesComponent implements OnInit {
  public Table: any;
  public editArticle: any = {};
  private WPAPI: any;

  @ViewChild(EditArticleComponent) Editor: EditArticleComponent;
  constructor(
    private router: Router,
    private apiWP: ApiWordpressService,
  ) {
    this.WPAPI = this.apiWP.getWPAPI();
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

    const reviewTable = $('#articles-review-table');
    this.Table = reviewTable.DataTable({
      pageLength: 20,
      page: 1,
      ordering: false, // Activer ou désactiver l'affichage d'ordre
      fixedHeader: true,
      responsive: false,
      "sDom": 'rtip',
      processing: true,
      serverSide: true,
      columns: [
        { data: 'name', render: (data) => {
            return `<span>${data}</span>`;
          }
        },
        { data: 'total_sales', render: (data, type, row) => {
            return data;
          }
        },
        { data: 'date_review', render: (data) => {
            return moment(data).fromNow();;
          }
        },
        { data: 'supplier', render: (data) => {
            return data.company_name;
          }
        },
        { data: null,
          render: (data, type, row, meta) => `
                <div class="fab fab-left">
                   <button class="btn btn-sm btn-primary btn-icon-only btn-circle btn-air" data-toggle="button">
                      <i class="fab-icon la la-bars"></i>
                      <i class="fab-icon-active la la-close"></i>
                   </button>
                   <ul class="fab-menu">
                      <li><button class="btn btn-primary btn-icon-only btn-circle btn-air edit-article"><i class="la la-edit"></i></button></li>
                      <li><button class="btn btn-danger btn-icon-only btn-circle btn-air remove-article"><i class="la la-trash"></i></button></li>
                   </ul>
                </div>`
        }
      ],
      initComplete: (setting, json) => {
        $('#articles-review-table tbody').on('click', '.remove-article', ev => {
          ev.preventDefault();
          const __article: any = getElementData(ev);
          this.Editor.onRemoveArticle(__article.ID);
        });

        $('#articles-review-table tbody').on('click', '.edit-article', e => {
          e.preventDefault();
          const __article: any = getElementData(e);
          Helpers.setLoading(true);
          this.WPAPI.fz_product().id(__article.ID).then(article => {
            this.editArticle = _.clone(article);
          });
        });

      },
      ajax: {
        url: `${config.apiUrl}/fz_product/review`,
        dataType: 'json',
        data: {
          columns: false,
          order: false,
        },
        beforeSend: function (xhr) {
          const __fzCurrentUser = JSON.parse(localStorage.getItem('__fzCurrentUser'));
          if (__fzCurrentUser && __fzCurrentUser.token) {
            xhr.setRequestHeader("Authorization",
              `Bearer ${__fzCurrentUser.token}`);
          }
        },
        type: 'POST',
      }
    });
  }

}
