import { Component, OnInit, Output, EventEmitter } from '@angular/core';
declare var $:any;

@Component({
  selector: 'app-filter-search-article',
  templateUrl: './filter-search-article.component.html',
  styleUrls: ['./filter-search-article.component.css']
})
export class FilterSearchArticleComponent implements OnInit {
  public item: string = '';
  @Output() findword = new EventEmitter();
  constructor() { }

  ngOnInit() {
    $('input#search-filter').on('change', e => {
      e.preventDefault();
      this.findword.emit({event: e, word: this.item});
    });
  }

}
