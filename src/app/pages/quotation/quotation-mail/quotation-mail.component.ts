import { Component, OnInit, Input, OnChanges, SimpleChanges, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import * as _ from 'lodash';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Helpers } from '../../../helpers';
import { config } from '../../../../environments/environment';
import Swal, { SweetAlertType } from 'sweetalert2';
import { ApiWoocommerceService } from '../../../_services/api-woocommerce.service';
declare var $:any;

@Component({
  selector: 'app-quotation-mail',
  templateUrl: './quotation-mail.component.html',
  styleUrls: ['./quotation-mail.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class QuotationMailComponent implements OnInit, OnChanges {
  public Form: FormGroup;
  public Order: any;
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
  private Woocommerce: any;

  @Input() order;
  constructor(
    private Http: HttpClient,
    private apiWC: ApiWoocommerceService,
    private cd: ChangeDetectorRef
  ) {
    this.Form = new FormGroup({
      subject: new FormControl('', Validators.required),
      content: new FormControl('', Validators.required)
    });
    this.Woocommerce = this.apiWC.getWoocommerce();
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.order.currentValue) {
      this.Order = _.clone(changes.order.currentValue);
      this.Form.patchValue({
        subject: `Devis #${this.Order.id} - Demande de confirmation`,
        content: "Bonjour, <br><br> <p>Vous trouverez ci-joint votre devis.<p><p>Nous vous remercions d'avoir choisi notre solution!<br><br> Cordialement."
      })
    }
  }

  onSend() {
    if (this.Form.invalid) return false;
    let Value: any = this.Form.value;
    Helpers.setLoading(true);
    let fData: FormData = new FormData();
    fData.append('subject', Value.subject);
    fData.append('message', Value.content);
    this.Woocommerce.put(`orders/${this.Order.id}`, {position: 1} , (err, data, res) => {
      this.Http.post<any>(`${config.apiUrl}/mail/${this.Order.id}`, fData)
      .subscribe(resp => {
        Helpers.setLoading(false);
        $('.modal').modal('hide');

        let response: any = _.clone(resp);
        let message: string = response.data;
        let title: string = response.success ? "Succès" : "Désolé";
        let type: SweetAlertType = response.success ? 'success' : "error";
        Swal.fire(title, message, type);
        
      }, err => {
        Swal.fire('Désolé', "Une erreur s'est produit pendant l'envoie. Veuillez réessayer plus tard", 'error');
        Helpers.setLoading(false);
      });
      this.cd.detectChanges();
    });
    
  }


}
