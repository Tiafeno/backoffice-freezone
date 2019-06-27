import {Component, OnInit, EventEmitter, ChangeDetectorRef, Output} from '@angular/core';
import {FormGroup, FormControl, Validators} from '@angular/forms';
import {Helpers} from '../../../helpers';
import * as _ from 'lodash';
import {FzServicesService} from '../../../_services/fz-services.service';
import {debounceTime, switchMap, catchError, map} from 'rxjs/operators';
import {Observable} from 'rxjs/Observable';
import {of} from 'rxjs/observable/of';
import {environment} from '../../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {ApiWordpressService} from '../../../_services/api-wordpress.service';
import * as moment from 'moment';
import {ApiWoocommerceService} from '../../../_services/api-woocommerce.service';
import {FzSecurityService} from "../../../_services/fz-security.service";
import Swal from "sweetalert2";

declare var $: any;

@Component({
  selector: 'app-add-article',
  templateUrl: './add-article.component.html',
  styleUrls: ['./add-article.component.css']
})
export class AddArticleComponent implements OnInit {
  private WP: any;
  private WC: any;
  public Form: FormGroup;
  public Suppliers: Array<any> = [];
  public Categories: Array<any> = [];
  public typeaheadCategories = new EventEmitter<string>();
  @Output() refresh = new EventEmitter<any>();

  constructor(
    private fzServices: FzServicesService,
    private Security: FzSecurityService,
    private http: HttpClient,
    private detector: ChangeDetectorRef,
    private apiWP: ApiWordpressService,
    private apiWC: ApiWoocommerceService
  ) {
    this.Form = new FormGroup({
      title: new FormControl('', Validators.required),
      mark: new FormControl('', Validators.required),
      price: new FormControl(null, Validators.required),
      priceDealer: new FormControl(null, Validators.required),
      marge: new FormControl(null, Validators.required),
      margeDealer: new FormControl(null, Validators.required),
      product_cat: new FormControl(null, Validators.required),
      user_id: new FormControl(null, Validators.required),
      stock: new FormControl(1, Validators.required)
    });
    this.WP = this.apiWP.getWPAPI();
    this.WC = this.apiWC.getWoocommerce();

    this.typeaheadCategories
      .pipe(debounceTime(400), switchMap(term => this.loadCategories(term)))
      .subscribe(items => {
        this.Categories = items;
        this.detector.markForCheck();
      }, (err) => {
        console.log('Error: ', err);
        this.Categories = [];
        this.detector.markForCheck();
      });
  }

  get f() {
    return this.Form.controls;
  }

  ngOnInit() {
    moment.locale('fr');
    $('#add-article-supplier-modal').on('show.bs.modal', e => {
      Helpers.setLoading(true);
      this.init();
    });
  }

  async init() {
    this.Suppliers = await this.fzServices.getSuppliers();
    if ( ! this.Security.hasAccess('s9', false)) {
      $('#add-article-supplier-modal').modal('hide');
      Swal.fire('Désolé', "Vous n'avez pas l'autorisation nécessaire pour ajouter un article", "error");

    }
    Helpers.setLoading(false);
  }

  loadCategories(term: string): Observable<any[]> {
    return this.http.get<any>(`https://${environment.SITE_URL}/wp-json/wp/v2/product_cat?hide_empty=false&search=${term}`).pipe(
      catchError(() => of([])),
      map(rsp => rsp.filter(ctg => ctg.parent !== 0)),
    );
  }

  onSubmit(): void {
    const Value: any = this.Form.value;
    if (this.Form.valid) {
      Helpers.setLoading(true);
      const categories: Array<any> = _.map(Value.product_cat, (cat) => { return {id: cat}; });
      const argsProduct = {
        type: 'simple',
        status: 'publish',
        name: Value.title,
        regular_price: '0',
        description: '',
        short_description: '',
        categories: categories,
        attributes: [
          {
            name: 'brands',
            options: Value.mark,
            visible: true
          }
        ],
        meta_data: [
          {key: '_fz_marge', value: Value.marge},
          {key: '_fz_marge_dealer', value: Value.margeDealer}
        ],
        images: []
      };
      this.WC.get(`products?search=${Value.title}`, (err, data, res) => {
        const response: any = JSON.parse(res);
        if (_.isEmpty(response) && _.isArray(response)) {
          this.WC.post('products', argsProduct, (errno, data_, res_) => {
            const product: any = JSON.parse(res_);
            const args: any = {
              status: 'publish',
              title: Value.title,
              content: '',
              price: parseInt(Value.price, 10),
              price_dealer: parseInt(Value.priceDealer, 10),
              total_sales: parseInt(Value.stock, 10),
              user_id: parseInt(Value.user_id, 10),
              product_id: product.id,
              product_cat: Value.product_cat,
              date_add: moment().format('YYYY-MM-DD HH:mm:ss'),
              date_review: moment().format('YYYY-MM-DD HH:mm:ss')
            };
            this.insert(args);
          });
        } else {
          const args: any = {
            status: 'publish',
            title: response.name,
            content: '',
            price: parseInt(Value.price, 10),
            price_dealer: parseInt(Value.priceDealer, 10),
            total_sales: parseInt(Value.stock, 10),
            user_id: parseInt(Value.user_id, 10),
            product_id: response.id,
            product_cat: Value.product_cat,
            date_add: moment().format('YYYY-MM-DD HH:mm:ss'),
            date_review: moment().format('YYYY-MM-DD HH:mm:ss')
          };
          this.insert(args);
        }
      });

    }
  }

  protected insert(args: any) {
    this.WP.fz_product().create(args).then(() => {
      Helpers.setLoading(false);
      this.refresh.emit();
      $('#add-article-supplier-modal').modal('hide');
      this.Form.reset();
    });
  }

}
