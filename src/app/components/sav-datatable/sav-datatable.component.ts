import { Component, OnInit, Input } from '@angular/core';
import * as _ from 'lodash';
import { ApiWordpressService } from '../../_services/api-wordpress.service';
import WPAPI = require('wpapi');

@Component({
  selector: 'app-sav-datatable',
  templateUrl: './sav-datatable.component.html',
  styleUrls: ['./sav-datatable.component.css']
})
export class SavDatatableComponent implements OnInit {
  private perPage: number = 10;
  private _status: Array<number> = [];
  @Input('status') set stSav(value: Array<number>) {
    this._status = value;
    if (!_.isEmpty(value)) {
      this.initializeDataTable();
    }
  } 
  get stSav(): Array<number> {
    return this._status;
  }
  public dataTableId: string = '';
  constructor(
    private wpapi: ApiWordpressService
  ) {
    // generer une id pour la table
    this.dataTableId = Array(8).fill("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz").map(function (x) {
      return x[Math.floor(Math.random() * x.length)]
    }).join('');
   }

  ngOnInit() {
  }

  private getQuery(): WPAPI {
    return this.wpapi.getWordpress().savs().context("edit").perPage(this.perPage);
  }


  initializeDataTable() {
    let metaQuery = [];
    // https://codex.wordpress.org/Class_Reference/WP_Meta_Query
    metaQuery.push({
      key: 'status_sav',
      value: this.stSav,
      compare: "IN",
      type: 'NUMERIC'
    });
    metaQuery['relation'] = 'AND';
    const request = this.getQuery().param('filter[meta_query]', Object.assign({}, metaQuery));
    request.headers().then(headers => {

    }).catch(err => {

    });
  }


}
