import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
declare var $:any;

@Component({
  selector: 'app-filter-search-article',
  templateUrl: './filter-search-article.component.html',
  styleUrls: ['./filter-search-article.component.css']
})
export class FilterSearchArticleComponent implements OnInit {
  public item: string = '';
  @Output() findword = new EventEmitter();
  @Input() placeh: string = "De quoi avez-vous besoin ?";
  constructor() { }

  ngOnInit() {
    $('input#search-filter').on('change', e => {
      e.preventDefault();
      this.findword.emit({event: e, word: this.item});
    });
  }

}
