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
    const routeSav = '/fz_sav/(?P<id>\\d+)';
    const routeFaqClient = '/fz_faq_client/(?P<id>\\d+)';
    const routeMailing = '/fz_mailing/(?P<id>\\d+)';
    const routeMailTemplate = '/_fz_mail_template/(?P<id>\\d+)';
    const routeUsers = '/users/(?P<id>\\d+)';
    const routeProducts = '/products/(?P<id>\\d+)';
    const routeGD = '/good-deal/(?P<id>\\d+)';
    const routeOrders = '/orders/(?P<id>\\d+)';
    const routeCatalog = '/catalog/(?P<id>\\d+)';
    const Params: Array<string> = ['filter', 'perPage', 'page', 'offset', 'search', 
    'context', 'head', 'include', 'exclude', 'headers', 'roles', 'status'];

    this.wpEndPoint.fz_product = this.wpEndPoint.registerRoute(namespace, routeArticles, { params: Params });
    this.wpEndPoint.savs = this.wpEndPoint.registerRoute(namespace, routeSav, { params: Params });
    this.wpEndPoint.faq_client = this.wpEndPoint.registerRoute(namespace, routeFaqClient, { params: Params });
    this.wpEndPoint.mailing = this.wpEndPoint.registerRoute(namespace, routeMailing, { params: Params });
    this.wpEndPoint.mail_template = this.wpEndPoint.registerRoute(namespace, routeMailTemplate, { params: Params });
    this.wpEndPoint.users = this.wpEndPoint.registerRoute(namespace, routeUsers, { params: Params });
    this.wpEndPoint.products = this.wpEndPoint.registerRoute(namespaceWoocommerce, routeProducts, {
      params: ['search', 'filter', 'sku']
    });
    this.wpEndPoint.good_deal = this.wpEndPoint.registerRoute(namespace, routeGD, { params: Params });
    this.wpEndPoint.catalog = this.wpEndPoint.registerRoute(namespace, routeCatalog, { params: Params });
    this.wpEndPoint.orders = this.wpEndPoint.registerRoute(namespaceWoocommerce, routeOrders);

    return this.wpEndPoint;
  }

  public getWordpress(): WPAPI {
    return this.getWPAPI();
  }

}
