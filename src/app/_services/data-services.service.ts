import { Injectable } from '@angular/core';
import { ApiWoocommerceService } from './api-woocommerce.service';
import { Observable } from 'rxjs';
import { from } from 'rxjs/observable/from';
import * as _ from 'lodash';

@Injectable()
export class DataServicesService {

  constructor(
    private apiWC: ApiWoocommerceService
  ) { }

  public getProductsAttributes(): Observable<any> {
    return from(new Promise(resolve => {
      this.apiWC.getWoocommerce().get("products/attributes", (er, data, res) => {
        if (_.isEmpty(res)) resolve([]);
        resolve(JSON.parse(res));
      })
    }));
  }

  public getAttributeTerms(attributeId: number): Observable<any[]> {
    if ( ! _.isNumber(attributeId)) Observable.of([]);
    return from(new Promise(resolve => {
      this.apiWC.getWoocommerce().get(`products/attributes/${attributeId}/terms?per_page=100`, (er, data, res) => {
        resolve(JSON.parse(res));
      })
    }));
  }
}
