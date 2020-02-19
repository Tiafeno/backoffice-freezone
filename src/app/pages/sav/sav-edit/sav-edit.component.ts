import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import { Helpers } from '../../../helpers';
import * as _ from 'lodash';
import * as moment from 'moment';
import Swal from 'sweetalert2';
import { AuthorizationService } from '../../../_services/authorization.service';
declare var $: any;

@Component({
  selector: 'app-sav-edit',
  templateUrl: './sav-edit.component.html',
  styleUrls: ['./sav-edit.component.css']
})
export class SavEditComponent implements OnInit {
  public ID: number = 0;
  public Author: any = {};
  public isAdmin: boolean = true;
  public isCommercial: boolean = false;
  public isSav: boolean = false;
  public reference: string = '';
  public Form: FormGroup;
  public FormforEditor: FormGroup;
  private Wordpress: any;
  public savProductStatus: Array<any> = [
    { label: '-- Choississez un status --', value: '' },
    { label: 'Sous garantie', value: 1 },
    { label: 'Hors garantie', value: 2 }
  ];

  public garenteeRange: Array<number>;
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
    toolbar: 'undo redo | bold backcolor  | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat ',
    plugins: ['lists'],
  };

  constructor(
    private apiWP: ApiWordpressService,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
    private auth: AuthorizationService
  ) {
    this.isAdmin = this.auth.isAdministrator();
    this.isCommercial = this.auth.isCommercial();
    this.isSav = this.auth.isSav();
    this.Wordpress = this.apiWP.getWordpress();
    this.garenteeRange = _.range(1, 13, 1);

    this.Form = new FormGroup({
      bill: new FormControl({ value: '', disabled: false }),// edit commercial
      date_purchase: new FormControl({ value: '', disabled: false }), // edit commercial
      description: new FormControl({ value: '', disabled: false }),
      mark: new FormControl({ value: '', disabled: false }),
      product: new FormControl({ value: '', disabled: false }),
      product_provider: new FormControl({ value: '', disabled: false }),
      serial_number: new FormControl({ value: '', disabled: false }),
      garentee: new FormControl({ value: '', disabled: false }), // edit commercial
      guarentee_product: new FormControl({ value: '', disabled: false }), // edit commercial
      accessorie: new FormControl(),
      other_accessories_desc: new FormControl('')
    });

    this.FormforEditor = new FormGroup({
      editor_accessorie: new FormControl(''),
      editor_other_accessorie_desc: new FormControl(''),
      editor_breakdown: new FormControl('')
    });
  }

  get f() { return this.Form.controls; }
  get guarenteeProduct() { return this.Form.get('guarentee_product'); }
  get providerProduct() { return this.Form.get('product_provider'); }

  private validateForm() {
    //Ajouter une parametre de securite pour sur les champs pour chaque type d'utilisateur
    (<any>Object).keys(this.Form.controls).forEach(element => {
      if (this.isCommercial) {
        let enableInputs = ['bill', 'date_purchase', 'garentee', 'guarentee_product'];
        if (_.indexOf(enableInputs, element) < 0) {
          this.Form.controls[element].disable();
        }
      }
      if (this.isSav) {
        if (element !== "serial_number") {
          this.Form.controls[element].disable();
        }
      }
    });
    this.cd.detectChanges();
  }

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
        this.Author = _.clone(resp.customer);
        this.reference = resp.reference;
        let args: any = {};
        (<any>Object).keys(this.Form.value).forEach(element => {
          let val: any = resp[element];
          if (element === 'date_purchase') {
            let momt = moment(resp[element], 'DD-MM-YYYY HH:mm:ss');
            args[element] = momt.isValid() ? momt.format('YYYY-MM-DD') : null;
            return;
          }
          if (element === 'accessorie') {
            args[element] = parseInt(val);
            return;
          }
          args[element] = _.isObject(val) ? parseInt(val.value, 10) : val;
        });

        console.info("Request response: ", args);
        this.validateForm()
        this.Form.patchValue(args);
        this.cd.detectChanges();
      });
    });
  }

  onSubmit() {
    if (this.Form.invalid) return;
    const Value: any = this.Form.value;
    Helpers.setLoading(true);
    this.Wordpress.savs().id(this.ID).update(Value).then(resp => {
      Helpers.setLoading(false);
      Swal.fire('Succès', 'Mise à jour effectuer avec succès', 'success');
    }).catch(err => {
      Helpers.setLoading(false);
      Swal.fire('Désolé', "Une erreur s'est produit", 'error');
    });
  }

}
