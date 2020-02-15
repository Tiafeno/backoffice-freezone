import { Component, OnInit, EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import * as moment from 'moment';
import { debounceTime, switchMap, catchError, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs/observable/of';
import { environment, config } from '../../../../environments/environment';
import { FormGroup, FormControl, Validators, FormArray, FormBuilder } from '@angular/forms';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';
import { Helpers } from '../../../helpers';
import { from } from 'rxjs/observable/from';
import { FzProduct } from '../../../supplier';
import RSVP from 'rsvp';
declare var $: any;

class User {
  id: number;
  name: string;
  company_name?: any;
  email: string;
  last_name: string;
  first_name: string;
  phone: string;
  address: string;
  username?: string;
  roles?: Array<string>;
}

class WPResponse {
  success: boolean;
  data: any
}

@Component({
  selector: 'app-quote-add',
  templateUrl: './quote-add.component.html',
  styleUrls: ['./quote-add.component.css']
})
export class QuoteAddComponent implements OnInit {
  private wordpress: any;
  private woocommerce: any;
  public typeaheadUsers = new EventEmitter<string>();
  public typeaheadProducts = new EventEmitter<string>();
  // Contient la listes des clients dans le champs recherche
  public Users: Array<User> = [];
  public Products: Array<any> = [];
  // Cette variable est utiliser si on clique sur un client
  public clientSelected: User;
  // content dialog modal step, default 1
  public step: number = 1; // 0: add user, 1: select client and, 2: Create quote
  public formAddUser: FormGroup;
  public formAddQuote: FormGroup;
  public cmpLineItems = _.range(1);
  public loadingProduct: boolean = false;
  public loadingUser: boolean = false;

  constructor(
    private Http: HttpClient,
    private apiwp: ApiWordpressService,
    private apiwc: ApiWoocommerceService,
    private formBuilder: FormBuilder,
    private detector: ChangeDetectorRef
  ) {
    this.wordpress = this.apiwp.getWordpress();
    this.woocommerce = this.apiwc.getWoocommerce();
    // Formulaire d'ajout d'utilisateur
    this.formAddUser = new FormGroup({
      role: new FormControl('', Validators.required),
      first_name: new FormControl(''),
      last_name: new FormControl(''),
      email: new FormControl('', Validators.compose([
        Validators.required,
        Validators.email
      ])),
      company_name: new FormControl(null),
      company_status: new FormControl('')
    });
    // formulaire d'ajout de demande
    this.formAddQuote = formBuilder.group({
      customer_id: 0,
      payment_method: 'cod',
      line_items: formBuilder.array([
        this.formBuilder.group({ product_id: null, quantity: 1 }),
        this.formBuilder.group({ product_id: null, quantity: 1 })
      ])
    });

    this.typeaheadUsers
      .pipe(debounceTime(400), switchMap(term => this.queryUsers(term)))
      .subscribe(items => {
        this.loadingUser = false;
        this.Users = items;
        this.detector.detectChanges();
      }, (err) => {
        console.log('Error: ', err);
        this.Users = [];
        this.detector.markForCheck();
      });

    this.typeaheadProducts
      .pipe(debounceTime(400), switchMap(term => this.queryWCProducts(term)))
      .subscribe(items => {
        this.loadingProduct = false;
        this.Products = items;
        this.detector.detectChanges();
      }, (err) => {
        console.log('Error: ', err);
        this.Users = [];
        this.detector.markForCheck();
      });
  }

  ngOnInit() {
  }

  get lineItems() { return <FormArray>this.formAddQuote.get('line_items'); }
  public onAddSpecialRequest() {
    this.lineItems.push(this.formBuilder.group({ product_id: null, quantity: 0 }));
  }

  public onRemoveLine(index: number) {
    this.lineItems.removeAt(index);
  }

  private queryUsers(term: string): Observable<any[]> {
    this.loadingUser = true;
    return this.Http.get<any>(`${config.apiUrl}/typeahead/suppliers?search=${term}`).pipe(
      catchError(() => of([])),
      map(rsp => rsp.filter(usr => usr.parent !== 0)),
    );
  }

  // https://www.learnrxjs.io/learn-rxjs/recipes/http-polling
  private queryWCProducts(term: string): Observable<any> {
    this.loadingProduct = true;
    return from(new Promise(resolve => {
      // Recherche par titre et description
      const bySearch = (): Promise<any> => {
        return new Promise(RES => { this.woocommerce.get(`products/?search=${term}`, (er, data, res) => {
            let products: Array<FzProduct> = JSON.parse(res);
            RES(products);
          });
        });
      }
      // Recherche par SKU (Match specific content)
      const bySku = (): Promise<any> => {
        return new Promise(RES => { this.woocommerce.get(`products/?sku=${term}`, (er, data, res) => {
            let products: Array<FzProduct> = JSON.parse(res);
            RES(products);
          });
        });
      }
      // Compiler les resultats obtenues
      RSVP.all([bySearch(), bySku()]).then(articlesArray => {
        let products = _.flatten(articlesArray);
        let formLineItems = this.lineItems; //FormArray
        const controls = formLineItems.controls;
        const prdIds: Array<number> = _(controls).map((ctrl: FormGroup) => {
          return parseInt(ctrl.get('product_id').value, 10);
        }).value();
        resolve(_(products).filter(product => _.indexOf(prdIds, product.id) < 0).value());
      });

    }));
  }

  /**
   * Event DOM element trigger by click
   * @param ev any
   */
  public onAddQuote(ev: any) {
    ev.preventDefault();
    $('#quote-select-client-dialog').modal('show');
  }

  /**
   * Event DOM element trigger by change
   * @param user any
   */
  public onSelectClient(user: any): any {
    if (_.isEmpty(user)) return false;
    this.clientSelected = _.clone(user);

    // Modifier le contenue du modal
    this.step = 2;
  }

  public resetProductList() {
    this.Products = [];
    this.detector.detectChanges();
  }

  public submitNewUser(ev: any) {
    ev.preventDefault();
    if (this.formAddUser.dirty && !this.formAddUser.invalid) {
      Helpers.setLoading(true);
      const { first_name, last_name, email, company_name, company_status, role } = this.formAddUser.value;
      const clientPassword = this.generaterandPassword(8);
      this.wordpress.users().create({
        username: "CLT-" + clientPassword,
        name: `${first_name} ${last_name}`,
        first_name: first_name,
        last_name: last_name,
        roles: role.toString(),
        email: email,
        company_name: company_name,
        company_status: company_status,
        password: clientPassword
      }).then(newClient => {
        // Envoyer les informations utilisateur par email au client
        let dataForm = new FormData();
        dataForm.append('pwd', clientPassword);
        this.Http.post<any>(`${config.apiUrl}/mail/user/${newClient.id}`, dataForm).subscribe((response: WPResponse) => {
          Helpers.setLoading(false);
          if (response.success) {
            this.formAddUser.reset();
          } else {
            Swal.fire("", response.data, "warning");
          }
          this.clientSelected = _.clone(newClient);
          this.step = 2;

          this.detector.detectChanges();
        }, error => {
          Helpers.setLoading(false);
          Swal.fire("", error.message, "warning");
        });
      }, err => {
        Helpers.setLoading(false);
        Swal.fire('', err.message, 'warning');
      });
    } else {
      Swal.fire('Informations', "Information errone", 'warning');
    }
  }

  public submitNewQuote(ev: any): any {
    ev.preventDefault();
    let { line_items, payment_method } = this.formAddQuote.value;
    const customer_id = this.clientSelected.id;
    const address: string = _.isNull(this.clientSelected.address) ? '' : this.clientSelected.address;
    const getClientRole = () => {
      let clientRoles = this.clientSelected.roles;
      return _.isUndefined(clientRoles[0]) ? 'fz-particular' : clientRoles[0];
    };
    // Filtrer les resultats
    line_items = _(line_items).filter(item => {
      return _.isNumber(item.product_id) && item.product_id != 0;
    }).value();
    console.log(line_items);
    if (_.isEmpty(line_items)) {
      Swal.fire("Erreur", "Vous n'avez ajoute aucune article. Veuillez ajouter au minimum une article", "error");
      return false;
    }
    const data = {
      payment_method: payment_method,
      payment_method_title: "Livraison",
      set_paid: true,
      customer_id: customer_id,
      user_id: customer_id,
      position: 0,
      date_send: moment().format('YYYY-MM-DD HH:mm:ss'),
      client_role: getClientRole(),
      billing: {
        first_name: this.clientSelected.first_name,
        last_name: this.clientSelected.last_name,
        address_1: address,
        address_2: "",
        city: "",
        state: "",
        postcode: "",
        country: "MG",
        email: this.clientSelected.email,
        phone: ""
      },
      shipping: {
        first_name: this.clientSelected.first_name,
        last_name: this.clientSelected.last_name,
        address_1: address,
        address_2: "",
        city: "",
        postcode: "",
        country: "MG"
      },
      line_items: line_items,
    };
    Helpers.setLoading(true);
    this.woocommerce.post('orders', data, (er, data, res) => {
      $('.modal').modal('hide');
      let response = JSON.parse(res);
      Helpers.setLoading(false);
      Swal.fire("Success", "Quote successfully added", "info");
      setTimeout(() => {
        location.reload();
      }, 1200);
    });
  }

  public onClickAdd(ev: any) {
    ev.preventDefault();
    Swal.mixin({
      confirmButtonText: 'Suivant &rarr;',
      cancelButtonText: 'Annuler',
      showCancelButton: true,
      progressSteps: ['1', '2']
    }).queue([
      {
        input: 'text',
        title: 'Adresse email',
        text: 'Veuillez ajouter l\'adresse email du client',
        inputValidator: (value) => {
          function emailIsValid(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
          }
          return new Promise((resolve, reject) => {
            if (_.isEmpty(value) || emailIsValid(value)) {
              resolve('Il y a une erreur');
            }
            resolve();
          });
        },
        allowOutsideClick: () => !Swal.isLoading(),
        preConfirm: (value) => {
          return new Promise(resolve => {
            resolve(true);
          })
        }
      },
      {
        input: 'text',
        title: 'Nom du client',
        text: 'Veuillez ajouter le nom du client',
        inputValidator: (value) => {
          return new Promise((resolve, reject) => {
            if (_.isEmpty(value)) {
              resolve('Ce champ est obligatoire');
            }

            resolve();
          });
        },
        allowOutsideClick: () => !Swal.isLoading(),
        preConfirm: (value) => {
          return new Promise(resolve => {
            resolve(true);
          })
        }
      },
    ]).then((result) => {
      if (result.value) {
        console.log(result.value);
        Swal.fire({
          title: 'Succès!',
          html: "Client ajouter avec succès",
          confirmButtonText: 'OK'
        }).then(successResp => {

        });

      }
    })
  }

  private generaterandPassword(long: number = 8): string {
    return Array(long).fill("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz").map(function (x) {
      return x[Math.floor(Math.random() * x.length)]
    }).join('');
  }

}
