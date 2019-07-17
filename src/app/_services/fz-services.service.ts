import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { ApiWordpressService } from './api-wordpress.service';
import { ApiWoocommerceService } from './api-woocommerce.service';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../environments/environment';
import { of } from 'rxjs/observable/of';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class FzServicesService {
  private Woocommerce: any;
  private Wordpress: any;
  public postResponseCache = new Map();

  constructor(
    private apiWp: ApiWordpressService,
    private apiWc: ApiWoocommerceService,
    private Http: HttpClient
  ) {
    this.Woocommerce = this.apiWc.getWoocommerce();
    this.Wordpress = this.apiWp.getWPAPI();
  }

  public getCategories(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.Woocommerce.get('products/categories?per_page=100', (err, data, res) => {
        const response: any = JSON.parse(res);
        if (!_.isUndefined(response.code)) {
          reject(response.message);
        }
        resolve(response);
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
    return new Promise((resolve, reject) => {
      this.Wordpress.users().roles('fz-supplier').then(users => {
        const response: any = users;
        if (!_.isUndefined(response.code)) {
          reject(response.message);
        }
        resolve(users);
      })
    })
  }

  public filterProducts(item: string = ''): Promise<any> {
    return new Promise(resolve => {
      if (_.isEmpty(item)) resolve([]);
      this.Woocommerce.get(`products?search=${item}`, (err, data, res) => {
        resolve(JSON.parse(res));
      });
    });
  }

  public getBenefit(price: any, marge: any): number {
    const benefit: number = (parseInt(price) * parseInt(marge)) / 100;
    const priceDealer: number = benefit + parseInt(price);
    return this.manageAlgorithm(priceDealer); // @return number
  }

  public manageAlgorithm(_value: number): number {
    if (_.isNumber(_value)) {
      const value = Math.round(_value);
      const valueS = value.toString();
      let position: number = (valueS.length - 1) - 1;
      if (valueS.charAt(position) !== '0' || valueS.charAt(position + 1) !== '0') {
        let $value = this.setCharAt(valueS, position, 0);
        $value = this.setCharAt($value, position + 1, 0)

        return parseInt($value) + 100;
      } else {
        return value;
      }
    }
    return 0;
  }

  public setCharAt(str: string, index: number, chr: any) {
    if (index > str.length - 1) return str;
    return str.substr(0, index) + chr + str.substr(index + 1);
  }

  loadCategories(): Observable<any[]> {
    const URL = `https://${environment.SITE_URL}/wp-json/wp/v2/product_cat?hide_empty=false&per_page=100`;
    const postCache = this.postResponseCache.get(URL);
    if (postCache) {
      return of(postCache);
    }
    const response = this.Http.get<any>(URL);
    response.subscribe(posts => this.postResponseCache.set(URL, posts));

    return response
  }
}
