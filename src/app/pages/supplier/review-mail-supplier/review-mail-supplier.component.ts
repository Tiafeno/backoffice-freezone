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
  public pendingArticle: Array<any> = [];
  @Input() supplier: any = {};

  public Form: FormGroup;

  constructor(
    private Http: HttpClient
  ) {
    this.Form = new FormGroup({
      subject: new FormControl('', Validators.required),
      message: new FormControl('', Validators.required)
    });
    this.Fournisseur.data = {};
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (_.isObject(changes.supplier.currentValue) && !_.isEmpty(changes.supplier.currentValue)) {
      this.Fournisseur = changes.supplier.currentValue;
      // TODO: Ajouter un objet et un message par default pour le mail
    }
  }

  onSend() {
    Swal.fire('En construction', "Cette option est en cour de construction", 'info');
  }

  openDialog() {
    let args: any =
    {
      post_type: 'fz_product',
      post_status: 'publish',
      meta_query: [
        {
          key: 'date_review',
          value: moment().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
          compare: '<',
          type: 'DATETIME'
        },
        {
          key: 'user_id',
          value: this.Fournisseur.ID,
          compare: '='
        }
      ]
    };
    let Form: FormData = new FormData();
    Form.append('args', JSON.stringify(args));
    Helpers.setLoading(true);
    this.Http.post<any>(`${config.apiUrl}/fz_product/query`, Form).subscribe(resp => {
      Helpers.setLoading(false);
      let response: any = _.clone(resp);
      let data: any = response.data;
      this.pendingArticle = data;
      $("#send-mail-modal").modal('show');
    });
    
  }

}
