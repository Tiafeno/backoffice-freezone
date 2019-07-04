import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ApiWordpressService } from '../../_services/api-wordpress.service';
import * as _ from 'lodash';
import { Helpers } from '../../helpers';
import Swal from 'sweetalert2';
import { AuthorizationService } from '../../_services/authorization.service';

@Component({
   selector: 'app-responsible',
   templateUrl: './responsible.component.html',
   styleUrls: ['./responsible.component.css']
})
export class ResponsibleComponent implements OnInit {
   public Form: FormGroup;
   public Commercials: Array<any> = [];
   public loading = false;
   private Wordpress: any;
   private isAdmin: boolean = false;

   @Input() clientId: number = 0;
   @Input() responsible: string = null;
   constructor(
      private apiWP: ApiWordpressService,
      private auth: AuthorizationService
   ) {
      this.isAdmin = this.auth.getCurrentUserRole() === 'administrator' ? true : false;
      this.Form = new FormGroup({
         commercial: new FormControl({ value: null, disabled: !this.isAdmin }, Validators.required)
      });
      this.Wordpress = this.apiWP.getWordpress();
   }

   ngOnInit() {
      this.loading = true;
      this.Wordpress.users().param('roles', 'editor').context('edit').then(resp => {
         this.Commercials = _.clone(resp);
         this.Form.patchValue({ commercial: parseInt(this.responsible) });
         this.loading = false;
      });

   }

   onSave() {
      if (this.Form.valid && this.isAdmin) {
         this.loading = true;
         const Value = this.Form.value;
         this.Wordpress.users().id(this.clientId).update({
            responsible: Value.commercial
         }).then(resp => {
            this.loading = false;
            Swal.fire('Succès', "Modification effectuer avec succès", 'success');
         });
      }
   }

}
