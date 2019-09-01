import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import { Helpers } from '../../../helpers';
import * as _ from 'lodash';
import * as moment from 'moment';
import Swal from 'sweetalert2';
declare var $: any;

@Component({
  selector: 'app-sav-edit',
  templateUrl: './sav-edit.component.html',
  styleUrls: ['./sav-edit.component.css']
})
export class SavEditComponent implements OnInit {
  public ID: number = 0;
  public Author: any = {};
  public reference: string = '';
  public Form: FormGroup;
  private Wordpress: any;
  public savProductStatus: Array<any> = [
    { label: '-- Choississez un status --', value: '' },
    { label: 'Sous garantie', value: 1 },
    { label: 'Hors garantie', value: 2 }
  ];
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
    private apiWP: ApiWordpressService,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef
  ) { 
    this.Wordpress = this.apiWP.getWordpress();
    this.Form = new FormGroup({
      bill: new FormControl(''),
      client: new FormControl(''),
      date_purchase: new FormControl(''),
      description: new FormControl(''),
      quotation_ref: new FormControl(''),
      mark: new FormControl(''),
      product: new FormControl(''),
      product_provider: new FormControl(''),
      serial_number: new FormControl(''),
      status_product: new FormControl('', Validators.required)
    });
  }

  get f() { return this.Form.controls; }
  get statusProduct() { return this.Form.get('status_product'); }
  get providerProduct() { return this.Form.get('product_provider'); }

  ngOnInit() {
    this.route.parent.params.subscribe(params => {
      this.ID = parseInt(params.id, 10);
      Helpers.setLoading(true);
      this.Wordpress.savs().id(this.ID).then(resp => {
        Helpers.setLoading(false);
        if (!_.isObject(resp)) {
          Swal.fire('Désolé', "Une erreur inconnue s'est produit", 'warning');
          return;
        }
        this.Author = _.clone(resp.auctor);
        this.reference = resp.reference;
        let args: any = {};
        (<any>Object).keys(this.Form.value).forEach(element => {
          let val : any = resp[element];
          if (element === 'date_purchase') {
            let momt = moment(resp[element], 'DD-MM-YYYY HH:mm:ss');
            args[element] = momt.isValid() ? momt.format('YYYY-MM-DD') : null;
            return;
          }
          args[element] = _.isObject(val) ? parseInt(val.value, 10) : val;
        });
        this.Form.patchValue(args);
        this.cd.detectChanges();
      });
    });
  }

  onSubmit() {
    if (this.Form.invalid) return;
    const Value: any = this.Form.value;
    Helpers.setLoading(true);
    this.Wordpress.savs().id(this.ID).update({
      bill: Value.bill,
      client: Value.client,
      description: Value.description,
      mark: Value.mark,
      product: Value.product,
      product_provider: Value.product_provider,
      serial_number: Value.serial_number,
      status_product: Value.status_product,
      quotation_ref: Value.quotation_ref,
      title: Value.product
    }).then(resp => {
      Helpers.setLoading(false);
      Swal.fire('Succès', 'Mise à jour effectuer avec succès', 'success');
    })
    .catch(err => {
      Helpers.setLoading(false);
      Swal.fire('Désolé', "Une erreur s'est produit", 'error');
    });
  }

}
