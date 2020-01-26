import { Component, OnInit, Input, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';
import { OrderItem, wpOrder } from '../../../order.item';
import * as _ from 'lodash';

@Component({
  selector: 'app-client-quote',
  templateUrl: './client-quote.component.html',
  styleUrls: ['./client-quote.component.css']
})
export class ClientQuoteComponent implements OnInit, OnChanges {
  private woocommerce: any;
  public orders: Array<wpOrder> = [];
  public loading: boolean = false;
  @Input() clientId: number = 0;
  constructor(
    private apiwc: ApiWoocommerceService,
    private cd: ChangeDetectorRef
  ) {
    this.woocommerce = this.apiwc.getWoocommerce();
   }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    const currentValue: any = changes.clientId.currentValue;
    if (currentValue && currentValue != 0) {
      this.loading = true;
      this.woocommerce.get(`orders?customer=${currentValue}`, (err, dat, res) => {
        this.loading = false;
        let orders: Array<OrderItem> = JSON.parse(res);
        this.orders = _(orders).map(order => new wpOrder(order)).value();
        this.cd.detectChanges();
      });
    }

  }
}

