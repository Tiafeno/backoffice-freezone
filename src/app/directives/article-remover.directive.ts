import { Directive, ElementRef, HostListener, Input, Output, EventEmitter } from '@angular/core';
import { FzSecurityService } from '../_services/fz-security.service';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { Helpers } from '../helpers';
import { ApiWordpressService } from '../_services/api-wordpress.service';
declare var $: any;

@Directive({
  selector: '[appArticleRemover]'
})
export class ArticleRemoverDirective {
  private Wordpress: any;
  @Input() articleId: number = 0;
  @Output() onRefresh = new EventEmitter();
  @HostListener('click') onMouseclick() {
    this.removeArticle(this.articleId);
  }
  
  constructor(
    el: ElementRef,
    private security: FzSecurityService,
    private apiWordpress: ApiWordpressService
  ) {
    this.Wordpress = this.apiWordpress.getWordpress();
  }

  public removeArticle(id: number) {
    if (!_.isNumber(id)) return false;
    if (this.security.hasAccess('s7')) {
      $('#edit-article-supplier-modal').modal('hide');
      Swal.fire({
        title: 'Confirmation',
        text: 'Voulez vous vraiment supprimer cette article?',
        type: 'warning',
        showCancelButton: true
      }).then(result => {
        if (result.value) {
          Helpers.setLoading(true);
          this.Wordpress.fz_product().id(id).delete({ force: true, reassign: 1 }).then(() => {
            Helpers.setLoading(false);
            this.onRefresh.emit();
            Swal.fire('Succès', 'Article supprimer avec succès', 'success');
          });
        }
      });
    }

  }

}
