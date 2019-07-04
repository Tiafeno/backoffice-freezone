import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, NgForm, FormControl, Validators } from '@angular/forms';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';
import { ActivatedRoute } from '@angular/router';
import { Helpers } from '../../../helpers';
import * as _ from 'lodash';
import { NgIf } from '@angular/common';
import Swal from 'sweetalert2';
import { AuthorizationService } from '../../../_services/authorization.service';
import { ResponsibleComponent } from '../../../components/responsible/responsible.component';

@Component({
  selector: 'app-edit-client',
  templateUrl: './edit-client.component.html',
  styleUrls: ['./edit-client.component.css']
})
export class EditClientComponent implements OnInit {
  public customerID: number = 0;
  public responsible: any = null;
  private Woocommerce: any;
  public Customer: any = null;
  public MetaData: Array<any> = [];
  public Form: FormGroup;
  public billForm: FormGroup;
  public shipForm: FormGroup;
  public roleOffice: number = 0;
  public Status: Array<any> = [
    { label: 'Particulier', value: 'particular' },
    { label: 'Entreprise / Société', value: 'company' },
  ];
  
  @ViewChild(ResponsibleComponent) private Responsible: ResponsibleComponent;
  constructor(
    private apiWc: ApiWoocommerceService,
    private route: ActivatedRoute,
    private auth: AuthorizationService
  ) {
    this.Form = new FormGroup({
      first_name: new FormControl(''),
      last_name: new FormControl('', Validators.required),
      address: new FormControl('', Validators.required), // Meta data
      phone: new FormControl('', Validators.required), // Meta data
      email: new FormControl({ value: '', disabled: true }, Validators.required), // Meta data
      stat: new FormControl(''), // Meta data
      nif: new FormControl(''), // Meta data
      rc: new FormControl(''), // Meta data
      cif: new FormControl(''), // Meta data
      client_status: new FormControl(null, Validators.required), // Meta data
    });

    /**
     * first_name
     * last_name
     * phone
     * email
     * state
     */
    this.billForm = new FormGroup({
      address_1: new FormControl('', Validators.required),
      address_2: new FormControl(''),
      city: new FormControl('', Validators.required),
      postcode: new FormControl('', Validators.required),
      company: new FormControl(''),
      country: new FormControl('', Validators.required),
      email: new FormControl({ value: '' }, Validators.required),
      first_name: new FormControl(''),
      last_name: new FormControl(''),
      phone: new FormControl(''),
      state: new FormControl(''),
    });


    this.shipForm = new FormGroup({
      address_1: new FormControl('', Validators.required),
      address_2: new FormControl(''),
      city: new FormControl('', Validators.required),
      first_name: new FormControl(''),
      last_name: new FormControl('', Validators.required),
      postcode: new FormControl('', Validators.required),
      company: new FormControl(''),
      country: new FormControl(''),
      state: new FormControl(''),
    });

    if (this.auth.getCurrentUserRole() === 'editor') {
      this.billForm.disable();
      this.Form.disable();
      this.shipForm.disable();
    }

    this.Woocommerce = this.apiWc.getWoocommerce();
  }

  get f() { return this.Form.controls; }
  get bf() { return this.billForm.controls; }
  get clientStatus() { return this.Form.get('client_status'); }

  ngOnInit() {
    this.route.parent.params.subscribe(params => {
      this.customerID = params.id;
      Helpers.setLoading(true);
      this.Woocommerce.get(`customers/${this.customerID}`, (err, data, res) => {
        const customer: any = JSON.parse(res);
        this.Customer = _.clone(customer);
        this.MetaData = _.clone(customer.meta_data);

        // Ajouter les valeurs dans le formulaire
        this.Form.patchValue({
          first_name: this.Customer.first_name,
          last_name: this.Customer.last_name,
          address: this.getMetaDataValue('address'),
          phone: this.getMetaDataValue('phone'),
          email: this.Customer.email,
          stat: this.getMetaDataValue('stat'),
          nif: this.getMetaDataValue('nif'),
          rc: this.getMetaDataValue('rc'),
          cif: this.getMetaDataValue('cif'),
          client_status: this.getMetaDataValue('client_status')
        });

        const role = this.getMetaDataValue('role_office');
        this.roleOffice = _.isNull(role) ? 0 : parseInt(role, 10);

        this.billForm.patchValue(this.Customer.billing);
        this.shipForm.patchValue(this.Customer.shipping);

        this.responsible = this.getMetaDataValue('responsible');
        Helpers.setLoading(false);
      });
    });
  }

  private getMetaDataValue(_key: any): string {
    const result: any = _.find(this.MetaData, { key: _key });
    return _.isUndefined(result) ? null : result.value;
  }

  onSubmit() {
    if (this.Form.valid && this.billForm.valid && this.shipForm.valid) {
      const Value: any = this.Form.value;

      const itemMeta = ['address', 'phone', 'stat', 'nif', 'rc', 'cif', 'client_status'];
      this.MetaData = _.map(this.Customer.meta_data, (meta) => {
        if (meta.key === 'address') meta.value = Value.address;
        if (meta.key === 'phone') meta.value = Value.phone;
        if (meta.key === 'stat') meta.value = Value.stat;
        if (meta.key === 'nif') meta.value = Value.nif;
        if (meta.key === 'rc') meta.value = Value.rc;
        if (meta.key === 'cif') meta.value = Value.cif;
        if (meta.key === 'client_status') meta.value = Value.client_status;

        return meta;
      });
      _.forEach(itemMeta, ($value, $key) => {
        let exist = _.find(this.Customer.meta_data, { key: $value });
        if (_.isUndefined(exist) && !_.isEmpty(Value[$value])) {
          this.MetaData.push({ key: $value, value: Value[$value] });
        }
      });

      let data: any = {
        first_name: Value.first_name,
        last_name: Value.last_name,
        meta_data: this.MetaData,
        billing: this.billForm.value,
        shipping: this.shipForm.value
      };

      let billing: any = data.billing;
      data.billing.postcode = data.shipping.postcode = billing.postcode.toString();
      data.billing.phone = _.isEmpty(billing.phone) ? Value.phone : billing.phone;
      data.billing.first_name = _.isEmpty(billing.first_name) ? Value.first_name : billing.first_name;
      data.billing.last_name = _.isEmpty(billing.last_name) ? Value.last_name : billing.last_name;

      Helpers.setLoading(true);
      this.Woocommerce.put(`customers/${this.customerID}`, data, (err, data, res) => {
        const response: any = JSON.parse(res);
        if (!_.isUndefined(response.code)) {
          Swal.fire('Désolé', response.message, 'error');
          return false;
        }
        Swal.fire('Succès', "Information mise à jour avec succès", 'success');
        Helpers.setLoading(false);
      });
    } else {
      const Controls: Array<any> = [this.Form.controls, this.billForm.controls, this.shipForm.controls];
      _.map(Controls, ctrl => {
        /**
         * Ask question
         * https://stackoverflow.com/questions/40529817/reactive-forms-mark-fields-as-touched/44150793
         */
        (<any>Object).values(ctrl).forEach(control => {
          control.markAsTouched();
        });
      })
    }
  }

}
