import { Component, OnInit } from '@angular/core';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import * as _ from 'lodash';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-article-supplier',
  templateUrl: './article-supplier.component.html',
  styleUrls: ['./article-supplier.component.css']
})
export class ArticleSupplierComponent implements OnInit {
  private WP: any;
  private WC: any;
  public Categories: any;
  public Products: any;
  public formArticle: FormGroup;

  constructor(
    private apiWC: ApiWoocommerceService,
    private apiWP: ApiWordpressService
  ) {
    this.WP = apiWP.getWPAPI();
    this.WC = apiWC.getWoocommerce();
    this.formArticle = new FormGroup({
      name: new FormControl('', Validators.required)
    });
  }

  ngOnInit() {
    this.init();
  }

  public async init() {
    this.Categories = await this.getCategories();
  }
  
  public getCategories(): Promise<any> {
    return new Promise(resolve => {
      this.WC.get('products/categories', (erro, data, res) => {
        resolve(JSON.parse(res));
      })
    })
  }

  public getProducts(item: string = ''): Promise<any> {
    return new Promise(resolve => {
      if (_.isEmpty(item)) resolve([]);
      this.WC.get(`products?search=${item}`, (err, data, res) => {
        resolve(JSON.parse(res));
      })
    })
  }

  onSubmit(): void {
    
  }

}
