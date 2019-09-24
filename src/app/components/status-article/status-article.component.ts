import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import * as _ from 'lodash';
import { ApiWoocommerceService } from "../../_services/api-woocommerce.service";
import { Helpers } from "../../helpers";
import { ApiWordpressService } from '../../_services/api-wordpress.service';
declare var $: any;

@Component({
  selector: 'app-status-article',
  templateUrl: './status-article.component.html',
  styleUrls: ['./status-article.component.css']
})
export class StatusArticleComponent implements OnInit {
  public Form: FormGroup;
  public inputStatus: Array<object> = [
    { key: '', value: '-- Selectionnez --' },
    { key: 'draft', value: 'Désactiver' },
    { key: 'publish', value: 'Publier' },
    { key: 'pending', value: 'En attente' }
  ];
  private Woocommerce: any;
  private Wordpress: any;
  private _article: any;
  @Output() refresh = new EventEmitter();

  @Input()
  set article(value: any) {
    this._article = _.clone(value);
    if (_.isObject(value)) {
      this.Form.patchValue({ status: value.status });
      this.cd.detectChanges();
    }
  }

  get article(): any {
    return this._article;
  }

  constructor(
    private apiWC: ApiWoocommerceService,
    private apiWP: ApiWordpressService,
    private cd: ChangeDetectorRef
  ) {
    this.Form = new FormGroup({
      status: new FormControl('', Validators.required)
    });
    this.Woocommerce = this.apiWC.getWoocommerce();
    this.Wordpress = this.apiWP.getWordpress();
  }

  ngOnInit() {
  }

  async onSubmit() {
    if (this.Form.invalid) return false;
    Helpers.setLoading(true);
    const Value = this.Form.value;
    const args = { status: Value.status };

    await this.putProductStatus(args);
    this.Wordpress.fz_product().id(this._article.id).update({ status: Value.status }).then(response => {
      Helpers.setLoading(false);
      this.refresh.emit();
      $('#status-product-modal').modal('hide');
    });
  }

  private putProductStatus(args: any): Promise<any> {
    return new Promise(resolve => {
      /**
       * Si on met en attente le produit, tout les articles qui sont déja pubier seront 'en attente'
       * Cette action sera definie pour la publication seulement
       */
      if (args.status !== 'publish') {
        resolve(false);
        return false;
      }
      this.Woocommerce.put(`products/${this._article.product_id}`, args, (err, data, res) => {
        resolve(JSON.parse(res));
      });
    });

  }

}
