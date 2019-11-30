import { Component, OnInit } from '@angular/core';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';
import { AuthorizationService } from '../../../_services/authorization.service';

@Component({
  selector: 'app-good-deal-lists',
  templateUrl: './good-deal-lists.component.html',
  styleUrls: ['./good-deal-lists.component.css']
})
export class GoodDealListsComponent implements OnInit {
  private wordpress: any;
  constructor(
    private apiWP: ApiWoocommerceService,
    private auth: AuthorizationService
  ) {
    this.wordpress = this.apiWP.getWoocommerce();
   }

  ngOnInit() {
  }

}
