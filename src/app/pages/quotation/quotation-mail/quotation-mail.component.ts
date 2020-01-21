import { Component, OnInit, Input, OnChanges, SimpleChanges, ViewEncapsulation, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import * as _ from 'lodash';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Helpers } from '../../../helpers';
import { config } from '../../../../environments/environment';
import Swal, { SweetAlertType } from 'sweetalert2';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';
import { FzSecurityService } from '../../../_services/fz-security.service';
import * as moment from 'moment';
import { wpItemOrder, wpOrder } from '../../../order.item';
import { Observable } from 'rxjs';
import RSVP from 'rsvp';
import { FzProduct } from '../../../supplier';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
declare var $: any;

@Component({
  selector: 'app-quotation-mail',
  templateUrl: './quotation-mail.component.html',
  styleUrls: ['./quotation-mail.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class QuotationMailComponent implements OnInit, OnChanges {
  private ID: number;
  private ORDER: wpOrder;
  private QITEMS: Array<wpItemOrder> = [];
  private ARTICLES: Array<FzProduct> = [];
  public Form: FormGroup;
  public Order: any;
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
  private Woocommerce: any;
  private Wordpress: any;
  @Output() resetItems = new EventEmitter();

  @Input() set orderId(valeur: number) { this.ID = _.clone(valeur); }
  get orderId(): number { return this.ID; }

  @Input() set order(valeur: wpOrder) { this.ORDER = _.clone(valeur); }
  get order(): wpOrder { return this.ORDER; }

  @Input() set itemsOrder(valeur: Array<wpItemOrder>) { this.QITEMS = _.clone(valeur); }
  get itemsOrder(): Array<wpItemOrder> { return this.QITEMS; }

  @Input() set articles(valeur: Array<FzProduct>) { this.ARTICLES = _.clone(valeur); }
  get articles(): Array<FzProduct> { return this.ARTICLES; }

  constructor(
    private Http: HttpClient,
    private apiWC: ApiWoocommerceService,
    private apiWP: ApiWordpressService,
    private cd: ChangeDetectorRef,
    private security: FzSecurityService
  ) {
    const message: string = `Chers clients, <br><br>
    Nous vous remercions pour votre demande de devis et en retour nous prions de trouver la proforma correspondant à vos besoins. 
    Dans l’attente de la confirmation de ce devis. <br> <br> Cordialement <br> L’équipe commerciale de Freezone`;
    this.Form = new FormGroup({
      subject: new FormControl('Demande de confirmation pour votre demande sur Freezone', Validators.required),
      content: new FormControl(message, Validators.required)
    });
    this.Woocommerce = this.apiWC.getWoocommerce();
    this.Wordpress = this.apiWP.getWordpress();
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    // this.itemsOrder = _.clone(changes.itemsOrder.currentValue);
    // this.orderId = _.clone(changes.orderId.currentValue);
  }

  async onSend() {
    moment.locale('fr');
    if (this.Form.invalid) return false;
    const Value: any = this.Form.value;
    if (this.security.hasAccess('s8')) {
      
      if (!_.includes([1, 2, 3, 4], parseInt(this.order.position))) {
        // Mettre a jour les quantites des articles
        let updates: Array<any> = [];
        for (let item of <Array<wpItemOrder>>this.itemsOrder) {
          const sumTake: number = _.sum(_.map(item.metaSupplierDataFn, val => parseInt(val.get, 10)));
          let currentItemArticlesIds: Array<number> = item.articleIdsFn;
          let currentItemArticles: Array<FzProduct> = _.filter(this.articles, a => _.includes(currentItemArticlesIds, a.id));
          for (let article of currentItemArticles) {
            let newQty: number = parseInt(article.total_sales) - sumTake;
            updates.push({
              id: article.id,
              total_sales: newQty < 0 ? 0 : newQty
            });
          }
        }

        if (!_.isEmpty(updates)) {
          var promises = updates.map(param => { return this.Wordpress.fz_product().id(param.id).update({ total_sales: param.total_sales }); });
          await RSVP.all(promises);
        }
      }

      Helpers.setLoading(true);
      const fData: FormData = new FormData();
      // Mettre la demamde pour 'Envoyer'
      await this.Woocommerce.put(`orders/${this.orderId}`, { position: 1, date_send: moment().format('YYYY-MM-DD HH:mm:ss') });

      // Envoyer le mail
      fData.append('subject', `Devis #${this.orderId} - Demande de confirmation pour votre demande sur Freezone`);
      fData.append('message', Value.content);
      this.Http.post<any>(`${config.apiUrl}/mail/order/${this.orderId}`, fData)
        .subscribe(resp => {
          Helpers.setLoading(false);
          $('.modal').modal('hide');
          this.resetItems.emit();
          const response: any = _.clone(resp);
          const message: string = response.data;
          const title: string = response.success ? "Succès" : "Désolé";
          const type: SweetAlertType = response.success ? 'success' : "error";
          Swal.fire(title, message, type);
        }, err => {
          Swal.fire('Désolé', "Une erreur s'est produit pendant l'envoie. Veuillez réessayer plus tard", 'error');
          Helpers.setLoading(false);
        });
      this.cd.detectChanges();
    }
  }


}
