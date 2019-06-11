import { Injectable } from '@angular/core';
import * as WPAPI from 'wpapi';
import { config } from '../../environments/environment';
import { AuthorizationService } from './authorization.service';

@Injectable()
export class ApiWordpressService {
  private wpEndPoint: any;

  constructor(
    private auth: AuthorizationService
  ) { }

  public getWPAPI(): any {
    this.wpEndPoint = new WPAPI({ endpoint: config.apiEndpoint });
    let __fzCurrentUser = this.auth.getCurrentUser();
    this.wpEndPoint.setHeaders({ Authorization: `Bearer ${__fzCurrentUser.token}` });

    let namespace = 'wp/v2';
    let namespaceWoocommerce = 'wc/v3';

    let routeArticles = '/fz_product/(?P<id>\\d+)';
    this.wpEndPoint.fz_product = this.wpEndPoint.registerRoute(namespace, routeArticles, {
      params: ['filter', 'per_page', 'page', 'offset', 'search', 'context', 'head', 'include']
    });

    let routeUsers = '/users/(?P<id>\\d+)';
    this.wpEndPoint.users = this.wpEndPoint.registerRoute(namespace, routeUsers, {
      params: ['roles', 'context', 'include', 'exclude', 'per_page', 'orderby', 'filter']
    });

    let routeProducts = '/products/(?P<id>\\d+)';
    this.wpEndPoint.products = this.wpEndPoint.registerRoute(namespaceWoocommerce, routeProducts, {
      params: ['search', 'filter', 'sku']
    });

    let routeGD = '/good-deal/(?P<id>\\d+)';
    this.wpEndPoint.good_deal = this.wpEndPoint.registerRoute(namespaceWoocommerce, routeGD, {
      params: ['search', 'context', 'include', 'exclude', 'filter']
    });

    let routeOrders = '/orders/(?P<id>\\d+)';
    this.wpEndPoint.orders = this.wpEndPoint.registerRoute(namespaceWoocommerce, routeOrders);

    return this.wpEndPoint;
  }

}
