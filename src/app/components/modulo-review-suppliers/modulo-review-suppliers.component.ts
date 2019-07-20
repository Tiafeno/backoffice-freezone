import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as _ from 'lodash';
import { config } from '../../../environments/environment';
import { ReviewMailSupplierComponent } from '../../pages/supplier/review-mail-supplier/review-mail-supplier.component';
import { ApiWordpressService } from '../../_services/api-wordpress.service';
import { Helpers } from '../../helpers';

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
    const formRequest: FormData = new FormData();
    formRequest.append('length', '20');
    formRequest.append('start', '0');
    this.Http.post<any>(`${config.apiUrl}/supplier/review`, formRequest).subscribe(resp => {
      this.suppliers = _.clone(resp.data);
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
