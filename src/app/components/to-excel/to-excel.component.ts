import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';
import * as Papa from 'papaparse';
import { HttpClient } from '@angular/common/http';
import { config } from '../../../environments/environment';
import { FzServicesService } from '../../_services/fz-services.service';
import { FzProductCSV } from '../../supplier';
import { Helpers } from '../../helpers';

@Component({
  selector: 'app-to-excel',
  templateUrl: './to-excel.component.html',
  styleUrls: ['./to-excel.component.css']
})
export class ToExcelComponent implements OnInit {
  private page: number = 5;
  constructor(
    private Http: HttpClient,
    private services: FzServicesService
  ) {}

  ngOnInit() {
  }

  public onClickSaveToExcel(event) {
    event.preventDefault();
    // Kick off the request
    Helpers.setLoading(true);
    this.Http.get<any>(`${config.apiUrl}/export/csv`).subscribe( (allPosts: Array<FzProductCSV>) => {
      let fzProducts: Array<any> = _.map(allPosts, post => {
        post.price_particular = this.services.getBenefit(post.price, post.marge_particular);
        post.price_dealer = this.services.getBenefit(post.price, post.marge_dealer);
        post.price_UF = this.services.getBenefit(post.price, post.marge);

        return post;
      });

      Helpers.setLoading(false);
      let CSV = Papa.unparse(fzProducts, {
        quotes: false, //or array of booleans
        quoteChar: '"',
        escapeChar: '"',
        delimiter: ";",
        header: true,
        newline: "\r\n",
        skipEmptyLines: false, //or 'greedy',
        columns: null, //or array of strings,
        dynamicTyping: true,
      });

      let blob = new Blob(['\ufeff' + CSV], {
        type: 'text/csv;charset=utf-8;'
      });

      let dateNow = new Date();
      let dwldLink = document.createElement("a");
      let url = URL.createObjectURL(blob);
      dwldLink.setAttribute("href", url);
      dwldLink.setAttribute("download", `Catalogue-${dateNow}.csv`);
      dwldLink.style.visibility = "hidden";
      document.body.appendChild(dwldLink);
      dwldLink.click();
      document.body.removeChild(dwldLink);

    });
  }

}
