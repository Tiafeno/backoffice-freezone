import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { config } from '../../../environments/environment';
import * as _ from 'lodash';
declare var $: any;

@Component({
  selector: 'app-accepted-item-suppliers',
  templateUrl: './accepted-item-suppliers.component.html',
  styleUrls: ['./accepted-item-suppliers.component.css']
})
export class AcceptedItemSuppliersComponent implements OnInit {
  public suppliers: Array<any>;
  public articles: Array<any>;
  public itemTable: any;
  constructor(
    private http: HttpClient
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
      this.articles = _.map(items, item => item.articles);
    });
  }

  public onMail(supplieId: number) {
    if ($.fn.dataTable.isDataTable('#item-table')) {
      this.itemTable.destroy();
    }

    this.itemTable = $('#item-table').DataTable({
      fixedHeader: true,
      responsive: false,
      "sDom": 'rtip',
      data: this.articles,
      columns: [
        { data: 'ID' },
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
            return `<span class="badge badge-success">${data}</span>`;
          }
        }

      ],
      initComplete: () => {
        $('#suppliers-item-modal').modal('show');
      }
    });
  }

}
