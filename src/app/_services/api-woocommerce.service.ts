import { Injectable } from '@angular/core';
import { AuthorizationService } from './authorization.service';
import * as WCAPI from 'woocommerce-api';
import { environment } from '../../environments/environment';

@Injectable()
export class ApiWoocommerceService {
  private WooCommerce: any;

  constructor( private auth: AuthorizationService) {}

  public getWoocommerce(): any {
    let origin = environment.SITE_URL;
    let __fzCurrentUser = this.auth.getCurrentUser();
    this.WooCommerce = new WCAPI({
      url: `https://${origin}`,
      consumerKey: __fzCurrentUser.wc.ck,
      consumerSecret: __fzCurrentUser.wc.cs,
      wpAPI: true,
      version: 'wc/v3',
      queryStringAuth: true
    });

    return this.WooCommerce;
  }

}
