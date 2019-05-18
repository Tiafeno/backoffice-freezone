import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChange, SimpleChanges } from '@angular/core';
import * as _ from 'lodash';
import { Helpers } from '../../helpers';
import { FzServicesService } from '../../_services/fz-services.service';
declare var $: any;

@Component({
  selector: 'app-filter-article',
  templateUrl: './filter-article.component.html',
  styleUrls: ['./filter-article.component.css']
})
export class FilterArticleComponent implements OnInit, OnChanges {
  public Categories: Array<any> = [];
  public Suppliers: Array<any> = [];
  public filterForm: any = {};
  @Output() search = new EventEmitter();
  // @Input() set word(word: string) {
  //   this.filterForm.word = word;
  //   this.search.emit({form: this.filterForm});
  //   this._word = word;
  // }
  @Input() word: string;

  ngOnChanges(changes: SimpleChanges): void {
    const word: SimpleChange = changes.word;
    this.filterForm.word = word.currentValue; // word.previousValue
    this.search.emit({ form: this.filterForm });
  }

  constructor(
    private fzServices: FzServicesService,
  ) {
  }

  ngOnInit() {
    this.init();
  }

  public async init() {
    Helpers.setLoading(true);
    this.Categories = await this.fzServices.getCategories();
    this.Suppliers = await this.fzServices.getSuppliers();
    Helpers.setLoading(false);
  }

  

  public onAdd($event) {
    this.search.emit({ form: this.filterForm });
  }

  /**
    * Filtrage pour des recherches dans une element "select"
    * @param term
    * @param item
    */
  customSearchFn(term: string, item: any) {
    var inTerm = [];
    term = term.toLocaleLowerCase();
    var paramTerms = $.trim(term).split(' ');
    $.each(paramTerms, (index, value) => {
      if (item.name.toLocaleLowerCase().indexOf($.trim(value).toLowerCase()) > -1) {
        inTerm.push(true);
      } else {
        inTerm.push(false);
      }
    });
    return _.every(inTerm, (boolean) => boolean === true);
  }

}
