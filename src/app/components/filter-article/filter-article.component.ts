import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChange, SimpleChanges } from '@angular/core';
import * as _ from 'lodash';
import { Helpers } from '../../helpers';
import { FzServicesService } from '../../_services/fz-services.service';
import { AuthorizationService } from '../../_services/authorization.service';
import { Supplier } from '../../supplier';
import { Taxonomy } from '../../taxonomy';
declare var $: any;

@Component({
  selector: 'app-filter-article',
  templateUrl: './filter-article.component.html',
  styleUrls: ['./filter-article.component.css']
})
export class FilterArticleComponent implements OnInit, OnChanges {
  public Categories: Array<Taxonomy> = [];
  public Suppliers: Array<Supplier> = [];
  public Status: Array<any> = [
    { label: "Tous", value: '' },
    { label: "Publier", value: 'publish' },
    { label: "En attente", value: 'pending' },
    { label: "Désactiver", value: 'draft' },
  ];
  public filterExpiration: Array<any> = [
    { label: "Tous", value: '' },
    { label: "Article à jour", value: 'up' },
    { label: "Article non à jour", value: 'down' },
  ];
  public filterForm: any = {};
  public isAdmin: boolean;
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
    private auth:AuthorizationService
  ) {
    this.isAdmin = this.auth.isAdministrator();
  }

  ngOnInit() {
    this.init();
  }

  public async init() {
    Helpers.setLoading(true);
    const categories = await this.fzServices.getCategories();
    this.Categories = _.isArray(categories) ? categories : [];
    this.Categories.unshift({term_id: 0, name: 'Tous', parent: 0});

    const suppliers = await this.fzServices.getSuppliers();
    this.Suppliers = _.isArray(suppliers) ? _.map(suppliers, sup => {
      sup.company_name = this.isAdmin ? sup.company_name : '-'; 
      return sup;
    }) : [];
    this.Suppliers.unshift({id: 0, company_name: 'Tous', reference: 0});
    Helpers.setLoading(false);
  }

  public onAdd($event) {
    console.log(this.filterForm);
    this.search.emit({ form: this.filterForm });
  }

  public getParentName(id: number): any {
    let term = _.find(this.Categories, { term_id: id });
    if (_.isUndefined(term)) return id;
    return term.name;
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
      const byName = item.name.toLocaleLowerCase().indexOf($.trim(value).toLowerCase()) > -1;
      if (byName) {
        inTerm.push(true);
      } else {
        inTerm.push(false);
      }
    });
    return _.every(inTerm, (boolean) => boolean === true);
  }

  /**
    * Filtrage pour des recherches dans une element "select"
    * @param term
    * @param item
    */
   searchFnSupplier(term: string, item: any) {
    var inTerm = [];
    term = term.toLocaleLowerCase();
    var paramTerms = $.trim(term).split(' ');
    console.log(item);
    $.each(paramTerms, (index, value) => {
      const byNameCompany = item.company_name.toLocaleLowerCase().indexOf($.trim(value).toLowerCase()) > -1;
      const byReference = item.reference.toLocaleLowerCase().indexOf($.trim(value).toLowerCase()) > -1;
      if (byNameCompany || byReference) {
        inTerm.push(true);
      } else {
        inTerm.push(false);
      }
    });
    return _.every(inTerm, (boolean) => boolean === true);
  }

}
