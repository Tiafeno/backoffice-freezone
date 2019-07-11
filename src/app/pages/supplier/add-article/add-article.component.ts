import { Component, OnInit, EventEmitter, ChangeDetectorRef, Output } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Helpers } from '../../../helpers';
import * as _ from 'lodash';
import { FzServicesService } from '../../../_services/fz-services.service';
import { debounceTime, switchMap, catchError, map } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { environment, config } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import * as moment from 'moment';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';
import { FzSecurityService } from "../../../_services/fz-security.service";
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
  private sellerPrice: number = 0.85;
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
      price: new FormControl(0, Validators.required),
      priceUf: new FormControl(0, Validators.required),
      priceDealer: new FormControl(0, Validators.required),
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
    if (!this.Security.hasAccess('s9', false)) {
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

  public onChangeMargeDealer(newValue) {
    const Value: any = this.Form.value;
    const price: number = Math.round(parseInt(Value.price) / this.sellerPrice);
    if (!_.isNaN(price) && price !== 0) {
      let marge: number = parseInt(Value.margeDealer);
      let rest: number = Math.round((price * marge) / 100);

      this.Form.patchValue({ 
        priceDealer:  rest + price
      });
      this.detector.detectChanges();
    }
  }

  public onChangeMarge(newValue) {
    const Value: any = this.Form.value;
    const price: number = Math.round(parseInt(Value.price) / this.sellerPrice);
    if (!_.isNaN(price) && price !== 0) {
      let marge: number = parseInt(Value.marge);
      let rest: number = Math.round((price * marge) / 100);

      this.Form.patchValue({ 
        priceUf:  rest + price
      });
      this.detector.detectChanges();
    }
  }

  onSubmit(): void {
    const Value: any = this.Form.value;
    if (this.Form.valid) {
      Helpers.setLoading(true);
      const Form: FormData = new FormData();
      Form.append('name', Value.title);
      Form.append('price_dealer', Value.priceDealer);
      Form.append('price', Value.price);
      Form.append('total_sales', Value.stock);
      Form.append('user_id', Value.user_id);
      Form.append('product_cat', Value.product_cat);
      Form.append('mark', Value.mark);
      Form.append('marge', Value.marge);
      Form.append('marge_dealer', Value.margeDealer);

      this.http.post<any>(`${config.apiUrl}/create/article`, Form).subscribe(response => {
        Helpers.setLoading(false);
        $('.modal').modal('hide');
        this.Form.reset();
        this.refresh.emit();
      });
    }
  }

}
