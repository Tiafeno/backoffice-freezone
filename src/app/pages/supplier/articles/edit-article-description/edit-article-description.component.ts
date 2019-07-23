import { Component, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';
import { ApiWordpressService } from '../../../../_services/api-wordpress.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import * as _ from 'lodash';
import { Helpers } from '../../../../helpers';
import { switchMap } from 'rxjs/operator/switchMap';
import { ApiWoocommerceService } from '../../../../_services/api-woocommerce.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-edit-article-description',
  templateUrl: './edit-article-description.component.html',
  styleUrls: ['./edit-article-description.component.css']
})
export class EditArticleDescriptionComponent implements OnInit, AfterViewInit {
  public id: any = 0; // product id
  public product: any = {};
  public formEditor: FormGroup;
  private Wordpress: any;
  private Woocommerce: any;
  public tinyMCESettings: any = {
    language_url: '/assets/js/langs/fr_FR.js',
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
    toolbar: 'undo redo | bold backcolor  | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat ',
    plugins: ['lists'],
  };
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiWP: ApiWordpressService,
    private apiWC: ApiWoocommerceService,
    private cd: ChangeDetectorRef
  ) {
    this.Wordpress = this.apiWP.getWordpress();
    this.Woocommerce = this.apiWC.getWoocommerce()
    this.formEditor = new FormGroup({
      name: new FormControl({ value: '', disabled: true }),
      description: new FormControl('', Validators.required)
    });
  }

  get f() { return this.formEditor.controls; }

  ngOnInit() {}

  ngAfterViewInit() {
    Helpers.setLoading(true);
    this.id = this.route.snapshot.paramMap.get('id');
    this.Woocommerce.get(`products/${this.id}`, (err, data, response) => {
      Helpers.setLoading(false);
      const product: any = JSON.parse(response);
      this.product = _.clone(product);
      this.formEditor.patchValue({
        name: product.name,
        description: product.description
      })
      this.cd.detectChanges();
    });

  }

  onSave() {
    if (this.formEditor.valid) {
      const value: any = this.formEditor.value;
      const data = {
        description: value.description
      };
      Helpers.setLoading(true);
      this.Woocommerce.put(`products/${this.id}`, data, (err, data ,res) => {
        Helpers.setLoading(false);
        Swal.fire('Succès', "Article mis à jour avec succès", 'success');
      });
    }
  }

}
