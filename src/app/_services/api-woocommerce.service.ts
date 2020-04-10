import { Injectable } from '@angular/core';
import { AuthorizationService } from './authorization.service';
import * as WCAPI from 'woocommerce-api';
import { environment } from '../../environments/environment';
import { LoginSchema } from '../schemas/login-schema/login-schema.component';

@Injectable()
export class ApiWoocommerceService {
  private WooCommerce: any;

  constructor( private auth: AuthorizationService) {}

  public getWoocommerce(): any {
    const origin: string = environment.SITE_URL;
    const __fzCurrentUser: LoginSchema = this.auth.getCurrentUser();
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
