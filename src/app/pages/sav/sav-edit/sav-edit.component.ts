import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import { Helpers } from '../../../helpers';
import * as _ from 'lodash';
import * as moment from 'moment';
import Swal from 'sweetalert2';
import { AuthorizationService } from '../../../_services/authorization.service';
import { SAV } from '../../../sav';
import { TinyConfig } from '../../../defined';
declare var $: any;

@Component({
  selector: 'app-sav-edit',
  templateUrl: './sav-edit.component.html',
  styleUrls: ['./sav-edit.component.css']
})
export class SavEditComponent implements OnInit {
  public ID: number = 0;
  public content: SAV;
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
  public tinyMCESettings: any = TinyConfig;

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
      bill: new FormControl({ value: '', disabled: false }, Validators.required),// edit commercial
      date_purchase: new FormControl({ value: '', disabled: false }), // edit commercial
      description: new FormControl({ value: '', disabled: false }),
      mark: new FormControl({ value: '', disabled: false }, Validators.required),
      product: new FormControl({ value: '', disabled: false }, Validators.required),
      product_provider: new FormControl({ value: '', disabled: false }),
      serial_number: new FormControl({ value: '', disabled: false }, Validators.required),
      garentee: new FormControl({ value: '', disabled: false }), // edit commercial
      guarentee_product: new FormControl({ value: '', disabled: false }), // edit commercial
      accessorie: new FormControl('', Validators.required),
      other_accessories_desc: new FormControl('')
    });

    this.FormforEditor = new FormGroup({
      editor_accessorie: new FormControl('', Validators.required),
      editor_other_accessorie_desc: new FormControl(''),
      editor_breakdown: new FormControl('', Validators.required)
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
        if (!_.isObjectLike(resp)) {
          Swal.fire('Désolé', "Une erreur inconnue s'est produit", 'warning');
          return;
        }
        this.Author = _.clone(resp.customer);
        this.content = _.clone(resp);
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
        const meta = this.content.meta;
        this.FormforEditor.patchValue({
          editor_accessorie: meta.editor_accessorie,
          editor_other_accessorie_desc: meta.editor_other_accessorie_desc,
          editor_breakdown: meta.editor_breakdown
        });
        this.validateForm();
        this.Form.patchValue(args);
        this.cd.detectChanges();
      });
    });
  }

  onSubmit() {
    if (this.Form.invalid) return false;
    if (!this.isAdmin && this.content.meta.has_edit) {
      Swal.fire("Sorry", "Vous ne pouvez plus modifier l'article", 'warning');
      return false;
    }
    const formValue: any = this.Form.value;
    const formEditorValue: any = this.FormforEditor.value;
    Helpers.setLoading(true);
    // add edit signature
    formValue.meta = {};
    if (!this.isAdmin)
      formValue.meta.has_edit = true;

    if (this.FormforEditor.dirty) {
      formValue.meta.editor_accessorie = formEditorValue.editor_accessorie;
      formValue.meta.editor_other_accessorie_desc = formEditorValue.editor_other_accessorie_desc;
      formValue.meta.editor_breakdown = formEditorValue.editor_breakdown;
    }
    this.Wordpress.savs().id(this.ID).update(formValue).then(resp => {
      Helpers.setLoading(false);
      Swal.fire('Succès', 'Mise à jour effectuer avec succès', 'success');
    }).catch(err => {
      Helpers.setLoading(false);
      Swal.fire('Désolé', "Une erreur s'est produit", 'error');
    });
  }

}
