import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';
import 'rxjs/add/observable/zip';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';
import { Helpers } from '../../../helpers';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { FzServicesService } from '../../../_services/fz-services.service';

@Component({
  selector: 'app-product-new',
  templateUrl: './product-new.component.html',
  styleUrls: ['./product-new.component.css']
})
export class ProductNewComponent implements OnInit {
  public Form: FormGroup;
  public WordPress: any;
  public Categories: Array<any> = [];
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
    private apiWC: ApiWoocommerceService,
    private router: Router
  ) {
    this.Form = new FormGroup({
      name:        new FormControl('', Validators.required),
      description: new FormControl(''),
      marge: new FormControl(''),
      sku:         new FormControl('', Validators.required),
      categorie:   new FormControl('', Validators.required)
    });
    this.WordPress = this.apiWC.getWoocommerce();
   }

   get f() { return this.Form.controls; }

  ngOnInit() {
    Helpers.setLoading(true);
    let Categories: Observable<any> = this.fzServices.loadCategories();
    Observable.zip(Categories).subscribe(results => {
      this.Categories = _.filter(results[0], result => { return result.parent != 0; });
      Helpers.setLoading(false);
    })
  }

  onSubmit(): void | boolean {
    if (this.Form.invalid || !this.Form.dirty) return false;
    let Value:any = this.Form.value;
    let ctgs: Array<any> = _.map(Value.categorie, ctg => { return {id: ctg }});
    let data: any = {
      name: Value.name,
      type: 'simple',
      status: 'publish',
      featured: false,
      on_sale: true,
      total_sales: 0,
      sku: Value.sku,
      meta_data: [
        {key: '_fz_marge', value: Value.marge}
      ],
      regular_price: '0', // Important, string value
      description: Value.description,
      short_description: Value.description,
      categories: _.clone(ctgs)
    };
    Helpers.setLoading(true);
    this.WordPress.post('products', data, (err, e, res) => {
      let response: any = JSON.parse(res);
      Helpers.setLoading(false);

      if (!_.isUndefined(response.code)) {
        Swal.fire('Désolé', response.message + '. Code: ' + response.code, 'error');
        return false;
      }
      
      Swal.fire({
        title: "Succès",
        text: "Produit ajouter avec succès",
        type: 'warning',
      }).then(result => {
        this.router.navigate(['/product', 'lists']);
      })
    });
  }

  

}
