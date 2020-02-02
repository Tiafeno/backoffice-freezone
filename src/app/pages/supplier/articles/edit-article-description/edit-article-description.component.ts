import { Component, OnInit, ChangeDetectorRef, AfterViewInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';
import { ApiWordpressService } from '../../../../_services/api-wordpress.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import * as _ from 'lodash';
import { Helpers } from '../../../../helpers';
import { ApiWoocommerceService } from '../../../../_services/api-woocommerce.service';
import Swal from 'sweetalert2';
import { FzServicesService } from '../../../../_services/fz-services.service';
import { Taxonomy } from '../../../../taxonomy';
import { AttributesComponent } from '../../../../components/attributes/attributes.component';
declare var $: any;

@Component({
  selector: 'app-edit-article-description',
  templateUrl: './edit-article-description.component.html',
  styleUrls: ['./edit-article-description.component.css']
})
export class EditArticleDescriptionComponent implements OnInit, AfterViewInit {
  public id: number = 0; // product id
  public product: any = {};
  public productAttributes: any[];
  public formEditor: FormGroup;
  public Categories: Array<Taxonomy> = [];
  private Wordpress: any;
  private Woocommerce: any;
  public tinyMCESettings: any = {
    language_url: '/assets/js/langs/fr_FR.js',
    menubar: false,
    content_css: [
      'https://fonts.googleapis.com/css?family=Montserrat:300,300i,400,400i',
      'https://www.tinymce.com/css/codepen.min.css'
    ],
    content_style: ".mce-content-body p { margin: 5px 0; }",
    inline: false,
    statusbar: true,
    resize: true,
    browser_spellcheck: true,
    min_height: 320,
    height: 320,
    toolbar: ' undo redo | bold backcolor  | alignleft aligncenter alignright alignjustify | bullist table numlist outdent indent | image removeformat ',
    plugins: ['lists table image '],
  };

  @ViewChild(AttributesComponent) FormAttribute: AttributesComponent;
  constructor(
    private route: ActivatedRoute,
    private fzServices: FzServicesService,
    private apiWP: ApiWordpressService,
    private apiWC: ApiWoocommerceService,
    private cd: ChangeDetectorRef
  ) {
    this.Wordpress = this.apiWP.getWordpress();
    this.Woocommerce = this.apiWC.getWoocommerce()
    this.formEditor = new FormGroup({
      name: new FormControl({ value: '', disabled: true }),
      categorie: new FormControl(''),
      description: new FormControl('', Validators.required)
    });
  }
  get f() { return this.formEditor.controls; }
  async ngOnInit() {
    let id = this.route.snapshot.paramMap.get('id');
    this.id = parseInt(id, 10);
    // Recuperer tous les categories
    this.Categories = await this.fzServices.getCategories();
  }

  ngAfterViewInit() {
    Helpers.setLoading(true);
    this.Woocommerce.get(`products/${this.id}`, (err, data, response) => {
      Helpers.setLoading(false);
      if (_.isEmpty(response)) return false;
      const product: any = JSON.parse(response);
      this.product = _.clone(product);
      this.productAttributes = product.attributes;
      this.formEditor.patchValue({
        name: product.name,
        description: product.description,
        categorie: _.isArray(product.categories) ? _.map(product.categories, ctg => ctg.id) : []
      })
      this.cd.detectChanges();
    });
  }

  onSave() {
    const value: any = this.formEditor.value;
    const attributeFormValue = this.FormAttribute.form.value;
    console.log(attributeFormValue);
    const attributes = _.map(attributeFormValue.attributes, attr => {
      delete attr.name;
      attr.visible = true; // rendre l'attribut visible dans FO
      return attr;
    });
    if (this.formEditor.valid) {
      const _categories = _.map(value.categorie, (ctg) => { return { id: parseInt(ctg, 10) }; });
      const data = {
        description: value.description,
        categories: _categories,
        attributes: attributes,
      };
      Helpers.setLoading(true);
      this.Woocommerce.put(`products/${this.id}`, data, (err, data, res) => {
        Helpers.setLoading(false);
        Swal.fire('Succès', "Article mis à jour avec succès", 'success');
      });
    }
  }

  public getParentName(id: number): any {
    let term = _.find(this.Categories, {term_id: id});
    if (_.isUndefined(term)) return id;
    return term.name;
  }

}
