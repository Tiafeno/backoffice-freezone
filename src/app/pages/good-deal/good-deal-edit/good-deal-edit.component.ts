import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import { ActivatedRoute } from '@angular/router';
import { Helpers } from '../../../helpers';
import { NodeGoodDeal } from '../../../annonce';
import * as _ from 'lodash';

@Component({
  selector: 'app-good-deal-edit',
  templateUrl: './good-deal-edit.component.html',
  styleUrls: ['./good-deal-edit.component.css']
})
export class GoodDealEditComponent implements OnInit {
  private wordpress: any;
  public ID: number = 0;
  public formEdit: FormGroup;
  constructor(
    private apiwp: ApiWordpressService,
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
  }

  ngOnInit() {
    this.route.parent.params.subscribe(params => {
      this.ID = parseInt(params.id, 10);
      Helpers.setLoading(true);
      this.wordpress.good_deal().id(this.ID).then(resp => {
        Helpers.setLoading(false);
        let annonce: NodeGoodDeal = _.clone(resp);
        this.formEdit.patchValue({
          title: annonce.title.rendered,
          content: annonce.content.rendered,
          price: annonce.meta.gd_price
        });
        this.cd.detectChanges();
      }, err => {});
    });
  }

  onSubmit() {
    if (this.formEdit.dirty && this.formEdit.valid) {
      const values: any = this.formEdit.value;
      const formData = new FormData();
      this.wordpress.good_deal().id(this.ID).update({}).then(
        resp => {},
        error => {}
      );
    }
  }

}
