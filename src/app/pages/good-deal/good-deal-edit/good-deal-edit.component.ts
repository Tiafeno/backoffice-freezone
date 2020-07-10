import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import { ActivatedRoute } from '@angular/router';
import { Helpers } from '../../../helpers';
import { NodeGoodDeal } from '../../../annonce';
import * as _ from 'lodash';
import { TinyConfig, MSG } from '../../../defined';
import { Taxonomy } from '../../../taxonomy';
import { FzServicesService } from '../../../_services/fz-services.service';
import { AuthorizationService } from '../../../_services/authorization.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-good-deal-edit',
  templateUrl: './good-deal-edit.component.html',
  styleUrls: ['./good-deal-edit.component.css']
})
export class GoodDealEditComponent implements OnInit {
  private wordpress: any;
  public ID: number = 0;
  public hasEdit: boolean = false;
  public categories: Taxonomy[];
  public formEdit: FormGroup;
  public tinyMCESettings: any = TinyConfig;
  constructor(
    private apiwp: ApiWordpressService,
    private services: FzServicesService,
    private auth: AuthorizationService,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef
  ) {
    this.wordpress = this.apiwp.getWordpress();
    this.formEdit = new FormGroup({
      title: new FormControl('', Validators.required),
      content: new FormControl('', Validators.required),
      price: new FormControl(0, Validators.compose([Validators.required, Validators.min(0)])),
      categorie: new FormControl([])
    });
    this.hasEdit = this.auth.isAdministrator(); // Seuelement l'administrateur peuvent modifier l'annonce
  }

  ngOnInit() {
    this.route.parent.params.subscribe(params => {
      this.ID = parseInt(params.id, 10);
      Helpers.setLoading(true);
      this.wordpress.good_deal().id(this.ID).then( async (resp) =>{
        this.categories = await this.services.getCategories();
        Helpers.setLoading(false);
        let annonce: NodeGoodDeal = _.clone(resp);
        this.formEdit.patchValue({
          title: annonce.title.rendered,
          content: annonce.content.rendered,
          price: annonce.meta.gd_price,
          categorie: annonce.product_cat
        });
        this.cd.detectChanges();
      }, err => {});
    });
  }

  onSubmit() {
    if (this.formEdit.dirty && this.formEdit.valid) {
      const values: any = this.formEdit.value;
      if (!this.auth.isAdministrator()) {
        Swal.fire(MSG.ACCESS.DENIED_TTL, MSG.ACCESS.DENIED_CTT, 'error');
        return false;
      }
      Helpers.setLoading(true);
      this.wordpress.good_deal().id(this.ID).update({
        title: values.title,
        content: values.content,
        product_cat: values.categorie,
        meta: {
          gd_price: values.price
        }
      }).then(
        resp => {
          Helpers.setLoading(false);
        },
        error => {
          Helpers.setLoading(false);
        }
      );
    }
  }

  public getParentName(id: number): any {
    let term = _.find(this.categories, { term_id: id });
    if (_.isUndefined(term)) return id;
    return term.name;
  }

}
