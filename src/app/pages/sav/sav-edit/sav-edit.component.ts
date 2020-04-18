import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import { Helpers } from '../../../helpers';
import * as _ from 'lodash';
import * as moment from 'moment';
import Swal from 'sweetalert2';
import { AuthorizationService } from '../../../_services/authorization.service';
import { SAV, WPSAV } from '../../../sav';
import { TinyConfig } from '../../../defined';
declare var $: any;

@Component({
  selector: 'app-sav-edit',
  templateUrl: './sav-edit.component.html',
  styleUrls: ['./sav-edit.component.css']
})
export class SavEditComponent implements OnInit {
  public ID: number = 0;
  public content: WPSAV;
  public Author: any = {};
  public isAdmin: boolean = true;
  public isCommercial: boolean = false;
  public isSav: boolean = false;
  public reference: string = '';
  public FormMain: FormGroup;
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

    this.FormMain = new FormGroup({
      bill: new FormControl({ value: '', disabled: false }, Validators.required),// edit commercial
      date_purchase: new FormControl({ value: '', disabled: false }), // edit commercial
      description: new FormControl({ value: '', disabled: false }),
      mark: new FormControl({ value: '', disabled: false }, Validators.required),
      product: new FormControl({ value: '', disabled: false }, Validators.required),
      product_provider: new FormControl({ value: '', disabled: false }),
      serial_number: new FormControl({ value: '', disabled: false }, Validators.required),
      garentee: new FormControl({ value: '', disabled: false }), // edit commercial
      guarentee_product: new FormControl({ value: '', disabled: false }), // edit commercial
      accessorie: new FormControl([0], Validators.required),
      other_accessories_desc: new FormControl('')
    });

    this.FormforEditor = new FormGroup({
      editor_accessorie: new FormControl([0], Validators.required),
      editor_other_accessorie_desc: new FormControl(''),
      editor_breakdown: new FormControl('', Validators.required)
    });
  }

  get f() { return this.FormMain.controls; }
  get guarenteeProduct() { return this.FormMain.get('guarentee_product'); }
  get providerProduct() { return this.FormMain.get('product_provider'); }

  public validateForm() {
    //Ajouter une parametre de securite pour sur les champs pour chaque type d'utilisateur
    (<any>Object).keys(this.FormMain.controls).forEach(element => {
      if (this.isCommercial) {
        // Les champs modifiable par les commercials
        let enableInputs = ['bill', 'date_purchase', 'garentee', 'guarentee_product'];
        if (_.indexOf(enableInputs, element) < 0) {
          this.FormMain.controls[element].disable();
        }
      }
      if (this.isSav) {
        if (element !== "serial_number") {
          this.FormMain.controls[element].disable();
        }
      }
    });
    this.cd.detectChanges();
    console.log(this.FormMain.value);
  }

  ngOnInit() {
    this.route.parent.params.subscribe(params => {
      this.ID = parseInt(params.id, 10);
      Helpers.setLoading(true);
      this.Wordpress.savs().id(this.ID).then(resp => {
        console.log(resp);
        Helpers.setLoading(false);
        // if (!_.isObjectLike(resp)) {
        //   Swal.fire('Désolé', "Une erreur inconnue s'est produit", 'warning');
        //   return;
        // }
        this.Author = _.clone(resp.customer);
        this.content = _.clone(resp);
        this.reference = resp.reference;
        this.cd.markForCheck();
        this.setMainForm();
        this.setEditorForm();
        this.validateForm();
      });
    });
  }

  public setMainForm() {
    let momt = moment(this.content.date_purchase, 'DD-MM-YYYY HH:mm:ss');
    this.FormMain.patchValue({
      bill: this.content.bill,// edit commercial
      date_purchase: momt.isValid() ? momt.format('YYYY-MM-DD') : null, // edit commercial
      description: this.content.description,
      mark: this.content.mark,
      product: this.content.title.rendered,
      product_provider: _.isObjectLike(this.content.product_provider) ? parseInt(this.content.product_provider.value, 10) : this.content.product_provider,
      serial_number: this.content.serial_number,
      garentee: parseInt(this.content.garentee), // edit commercial
      guarentee_product: _.isObjectLike(this.content.guarentee_product) ? parseInt(this.content.guarentee_product.value, 10) : this.content.guarentee_product, // edit commercial
      accessorie: _.map(this.content.accessorie, i => parseInt(i, 10)),
      other_accessories_desc: this.content.other_accessories_desc
    });
    this.FormMain.updateValueAndValidity();
    console.log("Patch for form main succeffuly");
  }

  public setEditorForm() {
    const meta = this.content.meta;
    const metaAccessories: any = _.isEmpty(meta.editor_accessorie) ? [] : JSON.parse(meta.editor_accessorie);
    const accessoires: any[] = _.isArray(metaAccessories) ? metaAccessories : [];
    this.FormforEditor.patchValue({
      editor_accessorie: _.map(accessoires, i => parseInt(i, 10)),
      editor_other_accessorie_desc: meta.editor_other_accessorie_desc,
      editor_breakdown: meta.editor_breakdown
    });
    this.FormforEditor.updateValueAndValidity();
    console.log("Form for editor patched");
  }

  onSubmit() {
    if (this.FormMain.invalid) return false;
    if (!this.isAdmin && this.content.meta.has_edit) {
      Swal.fire("Sorry", "Vous ne pouvez plus modifier cette demande", 'warning');
      return false;
    }
    let formValue: any = this.FormMain.value;
    const formEditorValue: any = this.FormforEditor.value;
    Helpers.setLoading(true);
    // Ajouter une date de reception sur la demande de service 
    formValue.date_receipt = moment().format("YYYY-MM-DD HH:mm:ss")
    // add edit signature
    formValue.meta = {};
    if (!this.isAdmin)
      formValue.meta.has_edit = true;

    if (this.FormforEditor.dirty) {
      formValue.meta.editor_accessorie = JSON.stringify(formEditorValue.editor_accessorie);
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
