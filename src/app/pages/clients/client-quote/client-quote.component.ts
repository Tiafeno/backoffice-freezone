import { Component, OnInit, Input, ChangeDetectorRef, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';
import { OrderItem, wpOrder } from '../../../order.item';
import * as _ from 'lodash';
import * as moment from "moment";
import { FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'app-client-quote',
  templateUrl: './client-quote.component.html',
  styleUrls: ['./client-quote.component.css']
})
export class ClientQuoteComponent implements OnInit, OnChanges {
  private woocommerce: any;
  public orders: Array<wpOrder> = [];
  public loading: boolean = false;
  public formDate: FormGroup;
  private request: any;
  @Input() clientId: number = 0;
  constructor(
    private apiwc: ApiWoocommerceService,
    private cd: ChangeDetectorRef
  ) {
    this.woocommerce = this.apiwc.getWoocommerce();
    this.formDate = new FormGroup({
      date_review: new FormControl('')
    });
    this.request = Object.create({}, {
      query: {
        value: function () {
          var esc = encodeURIComponent;
          return Object.keys(this)
            .map(k => esc(k) + '=' + esc(this[k]))
            .join('&');
        }
      }
    });
  }

  ngOnInit() {
    moment.locale("fr");
  }

  ngOnChanges(changes: SimpleChanges) {
    const currentValue: any = changes.clientId.currentValue;
    if (currentValue && currentValue != 0) {
      this.request.customer = currentValue;
      this.request.order = "desc";
      this.request.orderby = "id";
      this.request.per_page = 100;
      this.getOrders();
    }
  }

  @HostListener('change', ['$event'])
  onChangeDate(ev) {
    ev.preventDefault();
    let target = ev.target as HTMLInputElement;
    let dateSelect: moment.Moment = moment(target.value);
    if (!dateSelect.isValid()) return false;
    this.request.after = dateSelect.format();
    this.getOrders();
  }

  getOrders() {
    this.loading = true;
    this.woocommerce.get(`orders?${this.request.query()}`, (err, dat, res) => {
      this.loading = false;
      let orders: Array<OrderItem> = JSON.parse(res);
      this.orders = _(orders).map(order => new wpOrder(order)).value();
      this.cd.detectChanges();
    });
  }
}

