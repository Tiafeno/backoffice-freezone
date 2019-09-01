import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as _ from 'lodash';
import { config } from '../../../environments/environment';
import { ReviewMailSupplierComponent } from '../../pages/supplier/review-mail-supplier/review-mail-supplier.component';
import { ApiWordpressService } from '../../_services/api-wordpress.service';
import { Helpers } from '../../helpers';
import * as moment from 'moment';

@Component({
  selector: 'app-modulo-review-suppliers',
  templateUrl: './modulo-review-suppliers.component.html',
  styleUrls: ['./modulo-review-suppliers.component.css']
})
export class ModuloReviewSuppliersComponent implements OnInit {
  public suppliers: Array<any> = [];
  public selectedSupplier: any;
  private Wordpress: any;

  @ViewChild(ReviewMailSupplierComponent) Mail: ReviewMailSupplierComponent;
  constructor(
    private apiWP: ApiWordpressService,
    private Http: HttpClient,
    private cd: ChangeDetectorRef
  ) { 
    this.Wordpress = this.apiWP.getWordpress();
  }

  ngOnInit() {
    moment.locale('fr');
    const formRequest: FormData = new FormData();
    formRequest.append('length', '20');
    formRequest.append('start', '0');
    this.Http.post<any>(`${config.apiUrl}/supplier/review`, formRequest).subscribe(resp => {
      let suppliers: any = resp.data;
      
      suppliers = _.map(suppliers, (supplier) => {
        let reviewDate = supplier.send_mail_review_date;
        let reviewMoment = moment(reviewDate);
        supplier.sendReview = _.isEmpty(reviewDate) || _.isNull(reviewDate) ? false : (reviewMoment.isValid() ? reviewMoment.subtract(-1, 'days') > moment() : false);
        return supplier;
      })
      
      this.suppliers = _.clone(suppliers);
      console.log(suppliers);
      this.cd.detectChanges();
    });
  }

  onMail(supplierId: number) {
    Helpers.setLoading(true);
    this.Wordpress.users().id(supplierId).context('edit').then(resp => {
      Helpers.setLoading(false);
      let response: any = _.clone(resp);
      this.selectedSupplier = response;
      this.Mail.openDialog(supplierId);
      
    });
  }

}
