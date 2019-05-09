import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FzServicesService } from '../../../_services/fz-services.service';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Helpers } from '../../../helpers';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/zip';

@Component({
  selector: 'app-product-edit',
  templateUrl: './product-edit.component.html',
  styleUrls: ['./product-edit.component.css']
})
export class ProductEditComponent implements OnInit {
  private WC: any;
  private ID: number;
  public Form: FormGroup;
  public Categories: Array<any>;
  public tinyMCESettings: any = {
    language_url : '/assets/js/langs/fr_FR.js',
    menubar: false,
    content_css: [
       '//fonts.googleapis.com/css?family=Montserrat:300,300i,400,400i',
       '//www.tinymce.com/css/codepen.min.css'
    ],
    content_style: ".mce-content-body p { margin: 5px 0; }",
    inline: false,
    statusbar: true,
    resize: true,
    browser_spellcheck: true,
    min_height: 320,
    height: 320,
    toolbar: 'undo redo | bold italic backcolor  | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat ',
    plugins: ['lists'],
 };
  constructor(
    private fzServices: FzServicesService,
    private route: ActivatedRoute,
    private router: Router,
    private apiWC: ApiWoocommerceService

  ) {
    this.WC = this.apiWC.getWoocommerce();
    this.Form = new FormGroup({
      name: new FormControl('', Validators.required),
      description: new FormControl(''),
      sku:         new FormControl('', Validators.required),
      categorie:   new FormControl('', Validators.required)
    })
  }

  get f() { return this.Form.controls; }

  ngOnInit() {
    this.route.parent.params.subscribe(params => {
      this.ID = params.id;
      Helpers.setLoading(true);
      let Categories: Observable<any> = this.fzServices.loadCategories();
      this.WC.get(`products/${this.ID}`, (err, data, res) => {
        let response:any = JSON.parse(res);
        if (!_.isUndefined(response.code)) {
          Swal.fire('Désolé', response.message, 'error');
          return false;
        }
        Observable.zip(Categories).subscribe(results => {
          this.Categories= _.filter(results[0], result => result);
          let inputCtg: Array<number> = _.map(response.categories, ctg => { return ctg.id });
          this.Form.patchValue({
            name: response.name,
            description: response.description,
            sku: response.sku,
            categorie: inputCtg
          });
          Helpers.setLoading(false);
        });
        
      });
    })
  }

  onSubmit(): void | boolean {
    if (this.Form.invalid || !this.Form.dirty) {
      return false;
    }
    let Value: any = this.Form.value;
    let Ctg: Array<any> = _.map(Value.categorie, ctg => {return {id: ctg}; });
    let data: any = {
      name:        Value.name,
      description: Value.description,
      sku:         Value.sku,
      categories: _.clone(Ctg)
    };
    Helpers.setLoading(true);
    this.WC.put(`products/${this.ID}`, data, (err, data, res) => {
      Helpers.setLoading(false);
      let response: any = JSON.parse(res);
      if (!_.isUndefined(response.code)) {
        Swal.fire('Désolé', response.message, 'error');
        return false;
      }
      Swal.fire('Succès', "Produit mis à jour avec succès", 'success');
    });
  }

}
