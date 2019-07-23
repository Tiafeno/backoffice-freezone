import {
  Component,
  OnInit,
  Input,
  EventEmitter,
  Output,
  ChangeDetectorRef
} from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import * as _ from 'lodash';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { Helpers } from '../../../../helpers';
import { of } from 'rxjs/observable/of';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/zip';
import Swal from 'sweetalert2';
import { ApiWordpressService } from '../../../../_services/api-wordpress.service';
import * as moment from 'moment';
import { FzSecurityService } from '../../../../_services/fz-security.service';
import { FzServicesService } from '../../../../_services/fz-services.service';

declare var $: any;

@Component({
  selector: 'app-edit-article',
  templateUrl: './edit-article.component.html',
  styleUrls: ['./edit-article.component.css']
})
export class EditArticleComponent implements OnInit {
  public ID = 0;
  private WP: any;
  public Form: FormGroup;
  public Products: Array<any> = [];
  public Suppliers: Array<any> = [];
  public supplierReference: string = null;
  public postResponseCache = new Map();
  public notice: any = null;
  public dateReview: string;
  public dateReviewFromNow: string;
  public canEdit = true;

  private _article: any;

  @Input()
  set article(article: any) {
    this._article = _.clone(article);
    if (_.isObject(article)) {
      this.ID = article.id;
      if (!_.isEmpty(article)) this.initValues();
    }
    this.cd.detectChanges();
  }

  get article(): any {
    return this._article;
  }

  @Output() refresh = new EventEmitter<any>();

  constructor(
    private http: HttpClient,
    private security: FzSecurityService,
    private services: FzServicesService,
    private apiWP: ApiWordpressService,
    private cd: ChangeDetectorRef
  ) {
    this.canEdit = this.security.hasAccess('s6', false);
    this.Form = new FormGroup({
      title: new FormControl('', Validators.required),
      price: new FormControl({ value: 0, disabled: !this.canEdit }, Validators.required),
      priceDealer: new FormControl({ value: 0, disabled: false }, Validators.required),
      pricePro: new FormControl({ value: '', disabled: false }),
      priceParticular: new FormControl({ value: '', disabled: false }),
      marge: new FormControl({ value: 0 }, Validators.required),
      margeDealer: new FormControl({ value: 0 }, Validators.required),
      margeParticular: new FormControl({ value: 0 }, Validators.required),
      product: new FormControl({ value: null, disabled: true }, Validators.required),
      user_id: new FormControl(null, Validators.required),
      stock: new FormControl({ value: null, disabled: !this.canEdit }, Validators.required),

    });
    this.WP = this.apiWP.getWPAPI();
  }

  ngOnInit() {
    moment.locale('fr');
    $('#edit-article-supplier-modal').on('hide.bs.modal', e => {
      Helpers.setLoading(false);
    });
  }

  onSelectProduct($event) {
    this.Form.patchValue({ title: $event.title.rendered });
  }

  onChangeMarge(newValue) {
    const formValue: any = this.Form.value;
    const currentPrice: number = parseInt(formValue.price, 10);
    if (formValue.price) {
      const _pricePro: number = this.services.getBenefit(currentPrice, newValue);
      this.Form.patchValue({ pricePro: _pricePro });
      this.cd.detectChanges();
    }
  }

  onChangeMargeDealer(newValue) {
    const formValue: any = this.Form.value;
    const currentPrice: number = parseInt(formValue.price, 10);
    if (formValue.price) {
      const priceR: number = this.services.getBenefit(currentPrice, newValue);
      this.Form.patchValue({ priceDealer: priceR });
      this.cd.detectChanges();
    }
  }

  onChangeMargeParticular(newValue) {
    const formValue: any = this.Form.value;
    const currentPrice: number = parseInt(formValue.price, 10);
    if (formValue.price) {
      const _priceParticular: number = this.services.getBenefit(currentPrice, newValue);
      this.Form.patchValue({ priceParticular: _priceParticular });
      this.cd.detectChanges();
    }
  }

  /**
   * Cette evenement ce declanche quand on change le prix de revient
   * @param newValue 
   */
  onChangePrice(newValue) {
    const formValue: any = this.Form.value;
    const currentPrice: number = parseInt(newValue, 10);
    if (formValue.price) {

      const pricePro: number = this.services.getBenefit(currentPrice, formValue.marge);
      const priceR: number = this.services.getBenefit(currentPrice, formValue.margeDealer);
      const priceParticular: number = this.services.getBenefit(currentPrice, formValue.margeParticular);

      this.Form.patchValue({
        pricePro: pricePro,
        priceDealer: priceR,
        priceParticular: priceParticular
      });
      this.cd.detectChanges();
    }
  }


  loadPost(type: string, id?: number): Observable<any> {
    const URL = `https://${environment.SITE_URL}/wp-json/wp/v2/${type}?include=${id}&status=any`;
    const results = this.http.get<any>(URL);
    results.subscribe(resp => { }, error => {
      if (error instanceof HttpErrorResponse) {
        Swal.fire('Réquete invalide', error.message, 'error');
        Helpers.setLoading(false);
      }

    });
    return results;
  }

  loadSuppliers(): Observable<any> {
    const URL = `https://${environment.SITE_URL}/wp-json/wp/v2/users?roles=fz-supplier`;
    const postCache = this.postResponseCache.get(URL);
    if (postCache) { return of(postCache); }
    const response = this.http.get<any>(URL);
    response.subscribe(suppliers => this.postResponseCache.set(URL, suppliers));

    return response;
  }

  get f() {
    return this.Form.controls;
  }

  add_notice(msg: string, classes?: string) {
    this.notice = {};
    this.notice.msg = msg;
    this.notice.classes = _.isUndefined(classes) ? 'warning' : classes;
  }

  /**
   * Envoyer la formulaire de modification pour un article
   */
  onSubmit(): void | boolean {
    if (this.Form.invalid) {
      this.add_notice('Le formulaire est invalide', 'danger');
      return false;
    }
    if (!this.Form.dirty) {
      this.add_notice('Aucune modifications n\'ont été apportées', 'warning');
      return false;
    }
    if (!this.security.hasAccess('s6')) {
      return false;
    }
    const Values = this.Form.value;
    Helpers.setLoading(true);
    this.WP.fz_product().id(this.ID).update({
      title: Values.title,
      price: Values.price,
      marge: Values.marge, // Professional marge
      marge_dealer: Values.margeDealer,
      marge_particular: Values.margeParticular,
      total_sales: parseInt(Values.stock, 10),
      date_review: moment().format('YYYY-MM-DD HH:mm:ss')
    }).then(() => {
      $('#edit-article-supplier-modal').modal('hide');
      this.refresh.emit();
    });
  }

  /**
   * Initialiser et afficher la boite de dialogue pour la modification
   */
  initValues() {
    if (!this.security.hasAccess('s10')) {
      return;
    }
    Helpers.setLoading(true);
    this.notice = null;
    const ObsProduct: Observable<any> = this.loadPost('product', parseInt(this._article.product_id, 10));
    const ObsSuppliers: Observable<any> = this.loadSuppliers();
    const Zip = Observable.zip(ObsProduct, ObsSuppliers);
    Zip.subscribe(results => {
      this.Products = results[0];
      this.Suppliers = results[1];
      const currentSupplierEdit = _.find(this.Suppliers, { id: this._article.user_id });
      this.supplierReference = currentSupplierEdit.reference;
      this.cd.detectChanges();

      const price: number = parseInt(this._article.price, 10);
      const pricePro: number = this.services.getBenefit(price, this._article.marge);
      const priceDealer: number = this.services.getBenefit(price, this._article.marge_dealer);
      const priceParticular: number = this.services.getBenefit(price, this._article.marge_particular);

      this.Form.patchValue({
        title: this._article.title.rendered,
        price: this._article.price,
        priceDealer: Math.round(priceDealer),
        pricePro: Math.round(pricePro),
        priceParticular: Math.round(priceParticular),
        marge: this._article.marge,
        margeDealer: this._article.marge_dealer,
        margeParticular: this._article.marge_particular,
        product: this.Products[0].title.rendered,
        user_id: this._article.user_id,
        stock: this._article.total_sales
      } as any);

      this.Form.controls.user_id.disable();

      this.dateReview = moment(this._article.date_review).format('LLL');
      this.dateReviewFromNow = moment(this._article.date_review).fromNow();

      this.cd.detectChanges();
    }, error => {
    }, () => {
      $('#edit-article-supplier-modal').modal('show');
      Helpers.setLoading(false);
    });
  }

  /**
   * Supprimer une article dans la base de donnée
   * @param id
   */
  onRemoveArticle(id: number): void | boolean {
    if (!_.isNumber(id)) return false;
    if (this.security.hasAccess('s7')) {
      $('#edit-article-supplier-modal').modal('hide');
      Swal.fire({
        title: 'Confirmation',
        text: 'Voulez vous vraiment supprimer cette article?',
        type: 'warning',
        showCancelButton: true
      }).then(result => {
        if (result.value) {
          Helpers.setLoading(true);
          this.WP.fz_product().id(id).delete({ force: true, reassign: 1 }).then(resp => {
            this.refresh.emit();
            Helpers.setLoading(false);
            Swal.fire('Succès', 'Article supprimer avec succès', 'success');
          });
        }
      });
    }

  }

}
