import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import * as _ from 'lodash';
import * as moment from 'moment';
import { HttpClient } from '@angular/common/http';
import { config } from '../../../../environments/environment';
import { Helpers } from '../../../helpers';
import Swal from 'sweetalert2';
declare var $: any;

@Component({
   selector: 'app-review-mail-supplier',
   templateUrl: './review-mail-supplier.component.html',
   styleUrls: ['./review-mail-supplier.component.css']
})
export class ReviewMailSupplierComponent implements OnInit, OnChanges {
   public Fournisseur: any = {};
   public email = 'contact@freezone.click';
   public pendingArticle: Array<any> = [];
   @Input() supplier: any = {};

   public Form: FormGroup;
   public tinyMCESettings: any = {
      language_url: '/assets/js/langs/fr_FR.js',
      menubar: false,
      content_css: [
         '//fonts.googleapis.com/css?family=Montserrat:300,300i,400,400i',
         '//www.tinymce.com/css/codepen.min.css'
      ],
      content_style: '.mce-content-body p { margin: 5px 0; }',
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
      private Http: HttpClient
   ) {
      this.Form = new FormGroup({
         subject: new FormControl('', Validators.required),
         message: new FormControl('', Validators.required),
         articles: new FormControl('', Validators.required),
         mail_logistics_cc:  new FormControl(false),
         mail_commercial_cc: new FormControl(false),
      });
      this.Fournisseur.data = {};
   }

   ngOnInit() {
      $("#send-mail-modal").on('hide.bs.modal', e => {
         this.Form.patchValue({
            subject: '',
            message: '',
            articles: [],
            mail_logistics_cc: false,
            mail_commercial_cc: false
         });
      });
   }

   ngOnChanges(changes: SimpleChanges) {
      if (_.isObject(changes.supplier.currentValue) && !_.isEmpty(changes.supplier.currentValue)) {
         this.Fournisseur = changes.supplier.currentValue;
         // TODO: Ajouter un objet et un message par default pour le mail
      }
   }

   onSend() {
      if (this.Form.valid) {
         const Value: any = this.Form.value;
         const Form: FormData = new FormData();
         Form.append('subject', Value.subject);
         Form.append('message', Value.message);
         const ccLists: Array<any> = [];
         if (Value.mail_logistics_cc === true) ccLists.push('mail_logistics_cc');
         if (Value.mail_commercial_cc === true) ccLists.push('mail_commercial_cc');
         Form.append('articles', Value.articles);
         Form.append('cc', _.join(ccLists, ','));
         Helpers.setLoading(true);
         this.Http.post<any>(`${config.apiUrl}/mail/review/${this.Fournisseur.ID}`, Form).subscribe(result => {
            Helpers.setLoading(false);
            const response: any = _.clone(result);
            if (response.success) {
               this.Form.patchValue({
                  subject: '',
                  message: '',
                  articles: [],
                  mail_logistics_cc: false,
                  mail_commercial_cc: false
               });
               $('.modal').modal('hide');
               Swal.fire('Succès', response.data, 'success');
            } else {
               Swal.fire('Désolé', response.data, 'error');
            }
         });
      } else {
         console.log(this.Form.value);
         (<any>Object).values(this.Form.controls).forEach(element => {
            element.markAsTouched();
         });
      }
   }

   openDialog(supplierid: number) {
      const args: any = {
         post_type: 'fz_product',
         post_status: 'publish',
         posts_per_page: -1,
         meta_query: [
            {
               key: 'date_review',
               value: moment().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
               compare: '<',
               type: 'DATETIME'
            },
            {
               key: 'user_id',
               value: supplierid,
               compare: '='
            }
         ]
      };
      const Form: FormData = new FormData();
      Form.append('args', JSON.stringify(args));
      Helpers.setLoading(true);
      this.Http.post<any>(`${config.apiUrl}/fz_product/query`, Form).subscribe(resp => {
         Helpers.setLoading(false);
         const response: any = _.clone(resp);
         const data: any = response.data;
         this.pendingArticle = data;
         $('#send-mail-modal').modal('show');
      });
   }

}
