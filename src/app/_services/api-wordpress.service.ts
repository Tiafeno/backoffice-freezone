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

  public getWPAPI(): WPAPI {
    this.wpEndPoint = new WPAPI({ endpoint: config.apiEndpoint });
    const __fzCurrentUser = this.auth.getCurrentUser();
    this.wpEndPoint.setHeaders({ Authorization: `Bearer ${__fzCurrentUser.token}` });

    const namespace = 'wp/v2';
    const namespaceWoocommerce = 'wc/v3';

    const routeArticles = '/fz_product/(?P<id>\\d+)';
    this.wpEndPoint.fz_product = this.wpEndPoint.registerRoute(namespace, routeArticles, {
      params: ['filter', 'per_page', 'page', 'offset', 'search', 'context', 'head', 'include']
    });

    const routeUsers = '/users/(?P<id>\\d+)';
    this.wpEndPoint.users = this.wpEndPoint.registerRoute(namespace, routeUsers, {
      params: ['roles', 'context', 'include', 'exclude', 'per_page', 'orderby', 'filter']
    });

    const routeProducts = '/products/(?P<id>\\d+)';
    this.wpEndPoint.products = this.wpEndPoint.registerRoute(namespaceWoocommerce, routeProducts, {
      params: ['search', 'filter', 'sku']
    });

    const routeGD = '/good-deal/(?P<id>\\d+)';
    this.wpEndPoint.good_deal = this.wpEndPoint.registerRoute(namespaceWoocommerce, routeGD, {
      params: ['search', 'context', 'include', 'exclude', 'filter']
    });

    const routeOrders = '/orders/(?P<id>\\d+)';
    this.wpEndPoint.orders = this.wpEndPoint.registerRoute(namespaceWoocommerce, routeOrders);

    return this.wpEndPoint;
  }

}
