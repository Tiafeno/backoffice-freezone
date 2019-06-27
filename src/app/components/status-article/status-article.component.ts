import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import * as _ from 'lodash';
import {ApiWoocommerceService} from "../../_services/api-woocommerce.service";
import {Helpers} from "../../helpers";
declare var $:any;

@Component({
  selector: 'app-status-article',
  templateUrl: './status-article.component.html',
  styleUrls: ['./status-article.component.css']
})
export class StatusArticleComponent implements OnInit, OnChanges {
  public Form: FormGroup;
  public inputStatus: Array<object> = [
    {key: '', value: '-- Selectionnez --'},
    {key: 'publish', value: 'Publier'},
    {key: 'pending', value: 'Désactiver'}
  ];
  private Woocommerce: any;
  @Output() refresh = new EventEmitter();
  @Input() article: any = null;
  constructor(
    private apiWC: ApiWoocommerceService,
    private cd: ChangeDetectorRef
  ) {
    this.Form = new FormGroup({
      status: new FormControl('', Validators.required)
    });
    this.Woocommerce = this.apiWC.getWoocommerce();
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    const article: any = changes.article.currentValue;
    if (_.isObject(article)) {
      const currentStatus: any = _.find(this.inputStatus, {key: article.product_status});
      this.Form.patchValue({ status: currentStatus.key});
      this.cd.detectChanges();
    }
  }

  onSubmit(): void | boolean {
    if (this.Form.invalid) return false;
    const Value = this.Form.value;
    const args = { status: Value.status };
    Helpers.setLoading(true);
    this.Woocommerce.put(`products/${this.article.product_id}`, args, (err, data, res) => {
      Helpers.setLoading(false);
      const response = JSON.parse(res);
      this.refresh.emit();
      $('#status-product-modal').modal('hide');
    });
  }

}
