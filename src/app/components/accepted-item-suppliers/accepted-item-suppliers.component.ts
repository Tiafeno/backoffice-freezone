import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as moment from 'moment';
import { config } from '../../../environments/environment';
import * as _ from 'lodash';
import { FzServicesService } from '../../_services/fz-services.service';
import { AuthorizationService } from '../../_services/authorization.service';
import Swal from 'sweetalert2';
import { MSG } from '../../defined';
declare var $: any;

@Component({
  selector: 'app-accepted-item-suppliers',
  templateUrl: './accepted-item-suppliers.component.html',
  styleUrls: ['./accepted-item-suppliers.component.css']
})
export class AcceptedItemSuppliersComponent implements OnInit {
  public suppliers: Array<any>;
  public articles: Array<any>;
  public items: any;
  public itemTable: any;
  constructor(
    private http: HttpClient,
    private services: FzServicesService,
    private auth: AuthorizationService
  ) { }

  ngOnInit() {
    this.http.get(`${config.apiUrl}/suppliers_waiting`).subscribe((resp: Array<any>) => {
      const suppliers: Array<{ articles: any, data: any, user_id: number }> = _.clone(resp);
      let items = _.map(suppliers, (supplier) => {
        supplier.articles = _(supplier.articles).map(article => {
          const supArts: Array<{ ID: number, item_quantity: any }> = _.cloneDeep(supplier.articles);
          let currentUnionArticles = _.filter(supArts, { ID: article.ID });
          let itemQuantity = _.map(currentUnionArticles, i => parseInt(i.item_quantity, 10));
          article.item_quantity = _.sum(itemQuantity);
          return article;
        }).union().value();
        return supplier;
      })
      this.suppliers = _.map(items, item => item.data);
      this.items = _.clone(items);
    });
  }

  public onMail(supplieId: number) {
    let posts: any = _.find(this.items, {user_id: supplieId});
    this.articles = posts.articles;
    if (!this.auth.isAdministrator()) {
      Swal.fire(MSG.ACCESS.DENIED_TTL, MSG.ACCESS.DENIED_CTT, 'warning');
      return false;
    }
    $('#suppliers-item-modal').modal('show');
    if ($.fn.dataTable.isDataTable('#item-table')) {
      this.itemTable.destroy();
    }

    this.itemTable = $('#item-table').DataTable({
      fixedHeader: true,
      responsive: false,
      pageLength: 40,
      "sDom": 'rtip',
      data: this.articles,
      columns: [
        {
          data: 'name', render: (data, type, row) => {
            return data;
          }
        },
        {
          data: 'item_quantity', render: (data, type, row) => {
            return data;
          }
        },
        {
          data: 'item_price', render: (data) => {
            let price = this.services.currencyFormat(data);
            return `<span class="font-bold">${price}</span>`;
          }
        },
        {
          date: 'date_review', render: (data) => {
            let dateReview = moment(data);
            if (!dateReview.isValid()) return data;
            return dateReview.format('LLL');
          }
        }
      ],
      initComplete: () => {
        
      }
    });
  }

}
