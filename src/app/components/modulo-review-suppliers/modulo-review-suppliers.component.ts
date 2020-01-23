import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as _ from 'lodash';
import { config } from '../../../environments/environment';
import { ReviewMailSupplierComponent } from '../../pages/supplier/review-mail-supplier/review-mail-supplier.component';
import { ApiWordpressService } from '../../_services/api-wordpress.service';
import { Helpers } from '../../helpers';
import * as moment from 'moment';
import { AuthorizationService } from '../../_services/authorization.service';
import Swal from 'sweetalert2';
import { MSG } from '../../defined';

@Component({
  selector: 'app-modulo-review-suppliers',
  templateUrl: './modulo-review-suppliers.component.html',
  styleUrls: ['./modulo-review-suppliers.component.css']
})
export class ModuloReviewSuppliersComponent implements OnInit {
  public suppliers: Array<any> = [];
  public selectedSupplier: any;
  public isAdmin: boolean;
  private Wordpress: any;

  @ViewChild(ReviewMailSupplierComponent) Mail: ReviewMailSupplierComponent;
  constructor(
    private apiWP: ApiWordpressService,
    private Http: HttpClient,
    private cd: ChangeDetectorRef,
    private auth: AuthorizationService
  ) { 
    this.Wordpress = this.apiWP.getWordpress();
    this.isAdmin = this.auth.isAdministrator();
  }

  ngOnInit() {
    moment.locale('fr');
    const formRequest: FormData = new FormData();
    formRequest.append('length', '20');
    formRequest.append('start', '0');
    this.Http.post<any>(`${config.apiUrl}/supplier/review`, formRequest).subscribe(resp => {
      let suppliers: any = resp.data;
      suppliers = _.map(suppliers, (supplier) => {
        const reviewDate = supplier.send_mail_review_date;
        let reviewMoment = moment(reviewDate);
        const dateNow: any = moment();
        // Aujourd'hui a 06h du matin
        const todayAt6 = moment({
          year: dateNow.year(),
          month: dateNow.month(),
          days: dateNow.date(),
          hour: 6,
          minute: 0
      });
        supplier.sendReview = reviewMoment.isValid() ? reviewMoment > todayAt6 : false;
        return supplier;
      })
      this.suppliers = _.clone(suppliers);
      this.cd.detectChanges();
    });
  }

  onMail(supplierId: number) {
    if (!this.isAdmin) {
      Swal.fire(MSG.ACCESS.DENIED_TTL, MSG.ACCESS.DENIED_CTT, 'warning');
      return false;
    }
    Helpers.setLoading(true);
    this.Wordpress.users().id(supplierId).context('edit').then(resp => {
      Helpers.setLoading(false);
      let response: any = _.clone(resp);
      this.selectedSupplier = response;
      this.Mail.openDialog(supplierId);
      
    });
  }

}
