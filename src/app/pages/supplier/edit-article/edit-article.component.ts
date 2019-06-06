import { Component, OnInit, Input, OnChanges, SimpleChanges, EventEmitter, Output, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import * as _ from 'lodash';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Helpers } from '../../../helpers';
import { of } from 'rxjs/observable/of';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/zip';
import Swal from 'sweetalert2';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import * as moment from 'moment'
declare var $: any;

@Component({
  selector: 'app-edit-article',
  templateUrl: './edit-article.component.html',
  styleUrls: ['./edit-article.component.css']
})
export class EditArticleComponent implements OnInit, OnChanges {
  public ID: number = 0;
  private WP: any;
  public Form: FormGroup;
  public Products: Array<any> = [];
  public Suppliers: Array<any> = [];
  public postResponseCache = new Map();
  public notice: any = null;
  @Input() Article: any;
  @Output() refresh = new EventEmitter<any>();
  constructor(
    private http: HttpClient,
    private apiWP: ApiWordpressService,
    private cd: ChangeDetectorRef
  ) {
    this.Form = new FormGroup({
      title: new FormControl('', Validators.required),
      price: new FormControl(0, Validators.required),
      product_id: new FormControl({value: null, disabled: true}, Validators.required),
      user_id: new FormControl(null, Validators.required),
      stock: new FormControl(null, Validators.required)
    });
    this.WP = this.apiWP.getWPAPI();
  }

  ngOnInit() {
    $('#edit-article-supplier-modal').on('hide.bs.modal', e => {
      Helpers.setLoading(false);
    });
  }

  onSelectProduct($event) {
    this.Form.patchValue({ title: $event.title.rendered });
  }

  loadPost(type: string): Observable<any> {
    const URL = `https://${environment.SITE_URL}/wp-json/wp/v2/${type}?per_page=100`;
    const postCache = this.postResponseCache.get(URL);
    if (postCache) {
      return of(postCache);
    }
    const response = this.http.get<any>(URL);
    response.subscribe(posts => this.postResponseCache.set(URL, posts));

    return response
  }

  loadSuppliers(): Observable<any> {
    const URL = `https://${environment.SITE_URL}/wp-json/wp/v2/users?roles=fz-supplier`;
    const postCache = this.postResponseCache.get(URL);
    if (postCache) {
      return of(postCache);
    }
    const response = this.http.get<any>(URL);
    response.subscribe(suppliers => this.postResponseCache.set(URL, suppliers));

    return response
  }


  get f() { return this.Form.controls; }

  ngOnChanges(changes: SimpleChanges): void | boolean {
    if ( ! _.isUndefined(changes.Article.currentValue) && ! _.isEmpty(changes.Article.currentValue)) {
      let cV: any = changes.Article.currentValue;
      this.ID = _.isUndefined(cV.id) ? (_.isUndefined(cV.ID) ? 0 : cV.ID) : cV.id;
      if (this.ID === 0) return false;
      this.initValues();
      return true;
    }
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
      this.add_notice("Le formulaire est invalide", "danger");
      return false;
    }

    if ( ! this.Form.dirty ) {
      this.add_notice("Aucune modifications n'ont été apportées", 'warning');
      return false;
    }
    const Values = this.Form.value;
    Helpers.setLoading(true);
    this.WP.fz_product().id(this.ID).update({
      title: Values.title,
      price: Values.price,
      product_id: parseInt(Values.product_id),
      user_id: parseInt(Values.user_id),
      total_sales: parseInt(Values.stock),
      date_review: moment().format('YYYY-MM-DD HH:mm:ss')
    }).then(article => {
      $('#edit-article-supplier-modal').modal('hide');
      this.refresh.emit();
    })
  }

  /**
   * Initialiser et afficher la boite de dialogue pour la modification
   */
  initValues() {
    Helpers.setLoading(true);
    this.notice = null;
    const ObsProduct = this.loadPost('product');
    const ObsSuppliers = this.loadSuppliers();
    const Zip = Observable.zip(ObsProduct, ObsSuppliers);
    Zip.subscribe(results => {
      this.Products = _.isEmpty(this.Products) ? results[0] : this.Products;
      this.Suppliers = _.isEmpty(this.Suppliers) ? results[1] : this.Suppliers;
      this.Form.patchValue({
        title: this.Article.title.rendered,
        price: this.Article.price,
        product_id: this.Article.product_id,
        user_id: this.Article.user_id,
        stock: this.Article.total_sales
      });
      this.cd.detectChanges();
      $('#edit-article-supplier-modal').modal('show');
    }, error => {}, () => {
      Helpers.setLoading(false);
    } );
  }

  /**
   * Supprimer une article dans la base de donnée
   * @param id 
   */
  onRemoveArticle(id: number): void | boolean {
    if (!_.isNumber(id)) return false;
    $('#edit-article-supplier-modal').modal('hide');
    Swal.fire({
      title: "Confirmation",
      text: "Voulez vous vraiment supprimer cette article?",
      type: 'warning',
      showCancelButton: true
    }).then(result => {
      if (result.value) {
        Helpers.setLoading(true);
        this.WP.fz_product().id(id).delete({force: true, reassign: 1}).then(resp => {
          this.refresh.emit();
          Helpers.setLoading(false);
          Swal.fire("Succès", "Article supprimer avec succès", 'success');
        });
      }
    })
  }

}
