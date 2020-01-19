import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { FormGroup, NgForm, FormControl, Validators } from '@angular/forms';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';
import { ActivatedRoute } from '@angular/router';
import { Helpers } from '../../../helpers';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { AuthorizationService } from '../../../_services/authorization.service';
import { ResponsibleComponent } from '../../../components/responsible/responsible.component';
import { ClientQuoteComponent } from '../client-quote/client-quote.component';

@Component({
  selector: 'app-edit-client',
  templateUrl: './edit-client.component.html',
  styleUrls: ['./edit-client.component.css']
})
export class EditClientComponent implements OnInit {
  public customerID: number = 0;
  public role: string = '';
  public responsible: any = null;
  private Woocommerce: any;
  public Customer: any = null;
  public MetaData: Array<any> = [];
  public Form: FormGroup;
  public billForm: FormGroup;
  public shipForm: FormGroup;
  public roleOffice: number = 0;
  public Status: Array<any> = [
    { label: 'En attente', value: 'pending' },
    { label: 'Revendeur', value: 'dealer' },
    { label: 'Utilisateur final', value: 'professional' },
  ];

  @ViewChild(ResponsibleComponent) private Responsible: ResponsibleComponent;
  @ViewChild(ClientQuoteComponent) private clientQuotes: ClientQuoteComponent;
  constructor(
    private apiWc: ApiWoocommerceService,
    private route: ActivatedRoute,
    private auth: AuthorizationService,
    private cd: ChangeDetectorRef
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
      cin: new FormControl(''), // Meta data
      date_cin: new FormControl(''), // Meta data
      company_status: new FormControl(''), // Meta data
      company_name: new FormControl(''), // Meta data
    });

    /**
     * first_name
     * last_name
     * phone
     * email
     * state
     */
    this.billForm = new FormGroup({
      address_1: new FormControl(''),
      address_2: new FormControl(''),
      city: new FormControl(''),
      postcode: new FormControl(''),
      email: new FormControl(''),
      first_name: new FormControl(''),
      last_name: new FormControl(''),
      phone: new FormControl(''),
      state: new FormControl('Madagascar'),
    });

    this.shipForm = new FormGroup({
      address_1: new FormControl(''),
      address_2: new FormControl(''),
      city: new FormControl(''),
      first_name: new FormControl(''),
      last_name: new FormControl(''),
      postcode: new FormControl(''),
      state: new FormControl('Madagascar'),
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
  get companyStatus() { return this.Form.get('company_status'); }
  get clientRole() { return this.role; }

  ngOnInit() {
    this.route.parent.params.subscribe(params => {
      this.customerID = params.id;
      Helpers.setLoading(true);
      this.Woocommerce.get(`customers/${this.customerID}`, (err, data, res) => {
        const customer: any = JSON.parse(res);
        this.Customer = _.clone(customer);
        this.MetaData = _.clone(customer.meta_data);
        this.role = _.isArray(customer.role) ? customer.role[0] : customer.role;
        this.Form.patchValue({
          first_name: this.Customer.first_name,
          last_name: this.Customer.last_name,
          address: this.getMetaDataValue('address'),
          phone: this.getMetaDataValue('phone'),
          email: this.Customer.email,
        });
        // Ajouter les valeurs dans le formulaire
        if (this.role === 'fz-company') {
          const companyStatus: string = this.getMetaDataValue('company_status');
          this.Form.patchValue({
            stat: this.getMetaDataValue('stat'),
            nif: this.getMetaDataValue('nif'),
            rc: this.getMetaDataValue('rc'),
            cif: this.getMetaDataValue('cif'),
            company_status: companyStatus,
            company_name: this.getMetaDataValue('company_name'),
          });
        }
        if (this.role === 'fz-particular') {
          this.Form.patchValue({
            cin: this.getMetaDataValue('cin'),
            date_cin: this.getMetaDataValue('date_cin'),
          });
        }
        const role = this.getMetaDataValue('role_office');
        this.roleOffice = _.isNull(role) ? 0 : parseInt(role, 10);
        this.billForm.patchValue(this.Customer.billing);
        this.shipForm.patchValue(this.Customer.shipping);
        this.responsible = this.getMetaDataValue('responsible');
        this.cd.detectChanges();
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
      if (Value.company_status === 'pending') {
        Swal.fire('Avertissement', "Vous n'avez pas encore definie le client en utilisateur final ou en revendeur", 'warning');
        return false;
      }
      const itemMeta = ['address', 'phone', 'stat', 'nif', 'rc', 'cif', 'company_status', 'company_name'];
      this.MetaData = _.map(this.Customer.meta_data, (meta) => {
        if (meta.key === 'address') meta.value = Value.address;
        if (meta.key === 'phone') meta.value = Value.phone;
        if (meta.key === 'stat') meta.value = Value.stat;
        if (meta.key === 'nif') meta.value = Value.nif;
        if (meta.key === 'rc') meta.value = Value.rc;
        if (meta.key === 'cif') meta.value = Value.cif;
        if (meta.key === 'company_status') meta.value = Value.company_status;
        if (meta.key === 'company_name') meta.value = Value.company_name;
        return meta;
      });
      // Crée si la meta data n'existe pas
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
      let shipping: any = data.shipping;
      shipping.company = Value.company_name; 
      let billing: any = data.billing;
      data.billing.postcode = shipping.postcode = billing.postcode.toString();
      data.billing.phone = _.isEmpty(billing.phone) ? Value.phone : billing.phone;
      data.billing.first_name = _.isEmpty(billing.first_name) ? Value.first_name : billing.first_name;
      data.billing.last_name = _.isEmpty(billing.last_name) ? Value.last_name : billing.last_name;
      data.billing.company = Value.company_name;
      Helpers.setLoading(true);
      // Mettre à jour le client
      this.Woocommerce.put(`customers/${this.customerID}`, data, (err, data, res) => {
        const response: any = JSON.parse(res);
        if (!_.isUndefined(response.code)) {
          Swal.fire('Désolé', response.message, 'error');
          return false;
        }
        const responsible: any = this.getMetaDataValue("responsible");
        if (_.isNull(responsible) || _.isEmpty(responsible)) {
          Swal.fire('Succès', "Information mise à jour aves succès. Veuillez ajouter une commercial pour ce client.", 'info')
        } else {
          Swal.fire('Succès', "Information mise à jour avec succès", 'success');
        }
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
