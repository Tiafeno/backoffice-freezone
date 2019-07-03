import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';
import * as _ from 'lodash';
import { Helpers } from '../../../helpers';
import * as moment from 'moment';
declare var $:any;

@Component({
  selector: 'app-customer-edit',
  templateUrl: './customer-edit.component.html',
  styleUrls: ['./customer-edit.component.css']
})
export class CustomerEditComponent implements OnInit, OnChanges {
  public ID: number = 0;
  public hasAddress: boolean = false;

  
  public roleOffice: number;
  public clientStatus: string;
  public role: string = '';
  public status: string = '';
  public stat: string = '';
  public nif: string = '';
  public meta: any = {};

  public Client: any = {};
  private Woocommerce: any;
  @Input() customer;
  constructor(
    private route: ActivatedRoute,
    private apiWC: ApiWoocommerceService
  ) {
    this.Woocommerce = this.apiWC.getWoocommerce();
   }

  ngOnInit() {
    moment().locale('fr');
    this.route.parent.params.subscribe(params => {
      $('.modal-backdrop').hide();
      if (_.isUndefined(params.id)) return false;
      this.ID = params.id;
      this.initCustomer();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.customer.currentValue && changes.customer.currentValue !== 0) {
      this.ID = changes.customer.currentValue;
      this.initCustomer();
    }
  }

  private initCustomer() {
    Helpers.setLoading(true);
    this.Woocommerce.get(`customers/${this.ID}?context=edit`, (err, data, res) => {
      let response: any = JSON.parse(res);
      this.Client = _.clone(response);
      this.Client.date_created = moment(this.Client.date_created).format('LLL');
      if ( ! _.isEmpty(this.Client.billing.email) ) {
        this.hasAddress = true;
      }
      
      (<any>Object).values(this.Client.meta_data).forEach(element => {
        if (_.isUndefined(this.meta[element.key])) {
          this.meta[element.key] = element.value;
          switch (element.key) {
            case 'role_office':
              this.roleOffice = parseInt(element.value, 10);
              this.role = this.roleOffice === 0 ? 'En attente' : (this.roleOffice === 1 ? 'Acheteur' : 'Revendeur');
              break;

            case 'client_status':
              this.clientStatus = element.value;
              this.status = this.clientStatus === 'company' ? 'Professionel' : 'Particulier';
              break;
          
            default:
              break;
          }
        }
      });
      Helpers.setLoading(false);
    });
  }

}
