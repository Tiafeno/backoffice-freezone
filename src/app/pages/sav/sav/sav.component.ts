import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { config } from '../../../../environments/environment';
import * as moment from 'moment';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import { Helpers } from '../../../helpers';
import { Router } from '@angular/router';
import { FzSecurityService } from '../../../_services/fz-security.service';
import { HttpClient } from '@angular/common/http';
import { AuthorizationService } from '../../../_services/authorization.service';
import { MSG } from '../../../defined';
import RSVP from 'rsvp';
declare var $: any;

@Component({
  selector: 'app-sav',
  templateUrl: './sav.component.html',
  styleUrls: ['./sav.component.css']
})
export class SavComponent implements OnInit {
  
  constructor() {}

  ngOnInit() {
  }

 
}
