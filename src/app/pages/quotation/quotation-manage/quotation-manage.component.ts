import { Component, OnInit } from '@angular/core';
import { Helpers } from '../../../helpers';
import { ActivatedRoute } from '@angular/router';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';

@Component({
  selector: 'app-quotation-manage',
  templateUrl: './quotation-manage.component.html',
  styleUrls: ['./quotation-manage.component.css']
})
export class QuotationManageComponent implements OnInit {
  private ID: number = 0;
  private termId: number = 0;
  private Woocommerce: any;
  constructor(
    private route: ActivatedRoute,
    private apiWC: ApiWoocommerceService
  ) {
    this.Woocommerce = this.apiWC.getWoocommerce();
  }

  ngOnInit() {
    Helpers.setLoading(true);
    this.route.params.subscribe(params => {
      this.ID = parseInt(params.id);
      this.Woocommerce.get(`orders/${this.ID}`, async (err, data, res) => {
        Helpers.setLoading(false);
        console.log(params);
      });
    });
  }

}
