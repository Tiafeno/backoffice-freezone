import { Component, OnInit, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Helpers } from '../../../helpers';
import * as _ from 'lodash';
import { FzServicesService } from '../../../_services/fz-services.service';
import { debounceTime, switchMap, catchError, map } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import * as moment from 'moment'
declare var $: any;

@Component({
  selector: 'app-add-article',
  templateUrl: './add-article.component.html',
  styleUrls: ['./add-article.component.css']
})
export class AddArticleComponent implements OnInit {
  private WP: any;
  public Form: FormGroup;
  public Suppliers: Array<any> = [];
  public Products: Array<any> = [];
  public Categories: Array<any> = [];
  typeaheadProducts = new EventEmitter<string>();
  typeaheadCategories = new EventEmitter<string>();

  constructor(
    private fzServices: FzServicesService,
    private http: HttpClient,
    private detector: ChangeDetectorRef,
    private apiWP: ApiWordpressService
  ) {
    this.Form = new FormGroup({
      title: new FormControl('', Validators.required),
      price: new FormControl(0, Validators.required),
      product_cat: new FormControl(null, Validators.required),
      product_id: new FormControl(null, Validators.required),
      user_id: new FormControl(null, Validators.required),
      stock: new FormControl(null, Validators.required)
    });
    this.WP = this.apiWP.getWPAPI();
    this.typeaheadProducts
      .pipe(
        debounceTime(400),
        switchMap(term => this.loadProduct(term))
      )
      .subscribe(items => {
        this.Products = items;
        this.detector.markForCheck();
      }, (err) => {
        console.log('error', err);
        this.Products = [];
        this.detector.markForCheck();
      });
    this.typeaheadCategories
      .pipe(
        debounceTime(400),
        switchMap(term => this.loadCategories(term))
      )
      .subscribe(items => {
        this.Categories = items;
        this.detector.markForCheck();
      }, (err) => {
        console.log('error', err);
        this.Categories = [];
        this.detector.markForCheck();
      });
  }

  get f() { return this.Form.controls; }

  ngOnInit() {
    moment.locale('fr');
    $('#add-article-supplier-modal').on('show.bs.modal', e => {
      Helpers.setLoading(true);
      this.init();
      Helpers.setLoading(false);
    })
  }

  async init() {
    this.Suppliers = await this.fzServices.getSuppliers();
  }

  loadProduct(term: string): Observable<any[]> {
    return this.http.get<any>(`https://${environment.SITE_URL}/wp-json/wp/v2/product?search=${term}`).pipe(
      catchError(() => of([])),
      map(rsp => rsp),
    );
  }

  onSelectProduct($event) {
    this.Form.patchValue({ title: $event.title.rendered });
  }

  loadCategories(term: string): Observable<any[]> {
    return this.http.get<any>(`https://${environment.SITE_URL}/wp-json/wp/v2/product_cat?hide_empty=false&search=${term}`).pipe(
      catchError(() => of([])),
      map(rsp => rsp.filter(ctg => ctg.parent !== 0)),
    );
  }

  onSubmit(): void {
    if (this.Form.valid) {
      let value: any = this.Form.value;
      let args: any = {
        status: 'publish',
        title: value.title,
        content: '',
        price: parseInt(value.price),
        total_sales: parseInt(value.stock),
        user_id: parseInt(value.user_id),
        product_id: parseInt(value.product_id),
        product_cat: [parseInt(value.product_cat)],
        date_add: moment().format('YYYY-MM-DD HH:mm:ss'),
        date_review: moment().format('YYYY-MM-DD HH:mm:ss')
      };
      Helpers.setLoading(true);
      this.WP.fz_product().create(args).then(article => {
        Helpers.setLoading(false);
        $('#add-article-supplier-modal').modal('hide');
      })
    }
  }

}
