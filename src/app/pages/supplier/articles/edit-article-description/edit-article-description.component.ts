import { Component, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';
import { ApiWordpressService } from '../../../../_services/api-wordpress.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import * as _ from 'lodash';
import { Helpers } from '../../../../helpers';
import { ApiWoocommerceService } from '../../../../_services/api-woocommerce.service';
import Swal from 'sweetalert2';
import { FzServicesService } from '../../../../_services/fz-services.service';
declare var $: any;

@Component({
  selector: 'app-edit-article-description',
  templateUrl: './edit-article-description.component.html',
  styleUrls: ['./edit-article-description.component.css']
})
export class EditArticleDescriptionComponent implements OnInit, AfterViewInit {
  public id: any = 0; // product id
  public product: any = {};
  public formEditor: FormGroup;
  public Categories: Array<any> = [];
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
    toolbar: ' undo redo | bold backcolor  | alignleft aligncenter alignright alignjustify | bullist table numlist outdent indent | image removeformat ',
    plugins: ['lists table image '],
  };
  constructor(
    private route: ActivatedRoute,
    private router: Router,
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
    this.Categories = await this.fzServices.getCategories();
  }

  ngAfterViewInit() {
    Helpers.setLoading(true);
    this.id = this.route.snapshot.paramMap.get('id');
    this.Woocommerce.get(`products/${this.id}`, (err, data, response) => {
      Helpers.setLoading(false);
      const product: any = JSON.parse(response);
      this.product = _.clone(product);
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
    if (this.formEditor.valid) {
      const _categories = _.map(value.categorie, (ctg) => { return { id: parseInt(ctg, 10) }; });
      const data = {
        description: value.description,
        categories: _categories
      };
      Helpers.setLoading(true);
      this.Woocommerce.put(`products/${this.id}`, data, (err, data, res) => {
        Helpers.setLoading(false);
        Swal.fire('Succès', "Article mis à jour avec succès", 'success');
      });
    }
  }

  /**
    * Filtrage pour des recherches dans une element "select"
    * @param term
    * @param item
    */
  customSearchFn(term: string, item: any) {
    var inTerm = [];
    term = term.toLocaleLowerCase();
    var paramTerms = $.trim(term).split(' ');
    $.each(paramTerms, (index, value) => {
      if (item.name.toLocaleLowerCase().indexOf($.trim(value).toLowerCase()) > -1) {
        inTerm.push(true);
      } else {
        inTerm.push(false);
      }
    });
    return _.every(inTerm, (boolean) => boolean === true);
  }

}
