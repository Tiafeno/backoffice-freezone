import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { ApiWordpressService } from './api-wordpress.service';
import { ApiWoocommerceService } from './api-woocommerce.service';

@Injectable()
export class FzServicesService {
  private Woocommerce: any;
  private Wordpress: any;

  constructor(
    private apiWp: ApiWordpressService,
    private apiWc: ApiWoocommerceService
  ) {
    this.Woocommerce = this.apiWc.getWoocommerce();
    this.Wordpress = this.apiWp.getWPAPI();
   }

  public getCategories(): Promise<any> {
    return new Promise(resolve => {
      this.Woocommerce.get('products/categories?per_page=100', (err, data, res) => {
        resolve(JSON.parse(res));
      })
    })
  }

  public filterProducts(item: string = ''): Promise<any> {
    return new Promise(resolve => {
      if (_.isEmpty(item)) resolve([]);
      this.Woocommerce.get(`products?search=${item}`, (err, data, res) => {
        resolve(JSON.parse(res));
      })
    })
  }

  public getProducts(): Promise<any> {
    return new Promise(resolve => {
      this.Woocommerce.get(`products?per_page=50`, (err, data, res) => {
        resolve(JSON.parse(res));
      })
    })
  }

  public getSuppliers(): Promise<any> {
    return new Promise(resolve => {
      this.Wordpress.users().roles('fz-supplier').then(users => {
        resolve(users);
      })
    })
  }
}
