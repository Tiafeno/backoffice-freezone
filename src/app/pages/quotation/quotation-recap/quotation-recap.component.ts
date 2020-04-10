import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Helpers } from '../../../helpers';
import { ActivatedRoute } from '@angular/router';
import * as moment from 'moment';
import * as _ from 'lodash';
import * as RSVP from 'rsvp';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-quotation-recap',
  templateUrl: './quotation-recap.component.html',
  styleUrls: ['./quotation-recap.component.css']
})
export class QuotationRecapComponent implements OnInit {
  public ID: number = 0;
  public items: Array<any> = [];
  public wordpress: any;
  public woocommere: any;
  private data: Array<any> = []; // contient les meta data 'suppliers' des items
  protected products: Array<any> = [];
  protected suppliers: Array<any> = [];
  public tableData: Array<any> = [];
  constructor(
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute,
    private apiWP: ApiWordpressService,
    private apiWC: ApiWoocommerceService
  ) {
    this.wordpress = this.apiWP.getWordpress();
    this.woocommere = this.apiWC.getWoocommerce();
  }

  ngOnInit() {
    moment.locale('fr');
    Helpers.setLoading(true);
    this.route.parent.params.subscribe(params => {
      this.ID = parseInt(params.id);
      this.woocommere.get(`orders/${this.ID}`, async (err, data, res) => {
        Helpers.setLoading(false);
        let order = JSON.parse(res);
        this.items = order.line_items;

        _.each(this.items, (item, index) => {
          let suppliers: any = _.find(item.meta_data, { key: "suppliers" });
          let dataParser: Array<any> = JSON.parse(suppliers.value); // [{supplier: 450, get: "2", product_id: 0, article_id: 0, price: 0}] 

          // Ajouter dans data
          if (_.isArray(dataParser))
            _.map(dataParser, (data) => {
              this.data.push(data);
            });
        });

        const userPromises = _.map(this.data, data => parseInt(data.supplier, 10)).map(id => {
          return this.wordpress.users().id(id);
        });
        const productPromises = _.map(this.data, data => parseInt(data.product_id, 10)).map(id => {
          return new Promise((resolve) => {
            this.woocommere.get(`products/${id}`, (err, data, res) => {
              resolve(JSON.parse(res));
            });
          });
        });

        const rsvpUsers = RSVP.all(userPromises);
        const rsvpProducts = RSVP.all(productPromises);

        RSVP.hash({ suppliers: rsvpUsers, products: rsvpProducts }).then(results => {
          this.products = _.clone(results.products);
          this.suppliers = _.clone(results.suppliers);
          let datas = [];
          _.each(this.products, (product) => {
            _(this.data)
              .filter(item => { return item.product_id == product.id; })
              .map(item => {
                let data: any = {};
                const supplier = _.find(this.suppliers, { id: parseInt(item.supplier, 10) } as any);
                data.take = parseInt(item.get, 10);
                data.supplier = _.clone(supplier);
                data.name = product.name;
                datas.push(data);

                return item;
              }).value();
          });

          this.tableData = _.flatten(datas);
          this.cd.detectChanges();

        });

      });
    });
  }

}
