import { Component, OnInit, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import { AuthorizationService } from '../../../_services/authorization.service';
import { FzSecurityService } from '../../../_services/fz-security.service';
import * as RSVP from 'rsvp';
import * as _ from 'lodash';
import * as unescape from 'unescape';
import { Helpers } from '../../../helpers';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
declare var $: any;

@Component({
  selector: 'app-faq-page',
  templateUrl: './faq-page.component.html',
  styleUrls: ['./faq-page.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class FaqPageComponent implements OnInit {
  private wordpress: any;
  private Categories: Array<any> = [];
  public listGroup: Array<any> = [];
  public listFaq: Array<any> = [];
  public newForm: FormGroup;
  public isAdministrator: boolean = false;
  public tinyMCESettings: any = {
    language_url: '/assets/js/langs/fr_FR.js',
    menubar: false,
    content_css: [
      '//fonts.googleapis.com/css?family=Montserrat:300,300i,400,400i',
      '//www.tinymce.com/css/codepen.min.css'
    ],
    content_style: ".mce-content-body p { margin: 5px 0; }",
    inline: false,
    statusbar: true,
    resize: true,
    browser_spellcheck: true,
    min_height: 320,
    height: 320,
    toolbar: 'undo redo | bold italic backcolor  | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat ',
    plugins: ['lists'],
  };
  public formType: string = 'new'; // new or  edit
  constructor(
    private apiWordpress: ApiWordpressService,
    private auth: AuthorizationService,
    private security: FzSecurityService,
    private cd: ChangeDetectorRef
  ) {
    this.wordpress = this.apiWordpress.getWordpress();
    this.newForm = new FormGroup({
      id: new FormControl(''),
      title: new FormControl('', Validators.required),
      content: new FormControl('', Validators.required),
      category: new FormControl(null, Validators.required)
    });
    this.isAdministrator = this.auth.getCurrentUserRole() === 'administrator' ? true : false;
  }

  get f() { return this.newForm.controls; }
  onSubmit() {
    if (this.newForm.valid) {
      Helpers.setLoading(true);
      let Query: any = null;
      const args: any = {
        status: 'publish',
        title: this.newForm.value.title,
        content: this.newForm.value.content,
        categories: [parseInt(this.newForm.value.category, 10)]
      };
      if (this.formType === 'new') {
        Query = this.wordpress.posts().create(args);
      } else {
        Query = this.wordpress.posts().id(this.newForm.value.id).update(args);
      }
      Query.then((resp) => {
        this.formSuccess();
        this.formType = 'new';
      }).catch(err => {
        Helpers.setLoading(false);
        Swal.fire('Désolé', "Une erreur s'est produite. Veuillez réessayer plus tard. Merci", 'error');
      });
    }
  }

  onEdit(articleId: number) {
    const article: any = _.find(this.listFaq, { id: articleId } as any);
    if (!_.isUndefined(article) && _.isObject(article)) {
      this.formType = 'edit';
      this.newForm.patchValue({
        id: article.id,
        title: article.title.rendered,
        content: article.content.rendered,
        category: _.isArray(article.categories) && !_.isEmpty(article.categories) ? article.categories[0] : null
      });
      $('#question-dialog').modal('show');
    } else {
      Swal.fire('Avertissement', "Article introuvable", 'info');
    }
  }

  onRemove(articleId: number) {
    if (_.isNumber(articleId)) {
      Swal.fire({
        title: 'Confirmation',
        html: `Voulez vous vraiment supprimer la publication?`,
        type: 'warning',
        showCancelButton: true
      }).then(result => {
        if (result.value) {
          Helpers.setLoading(true);
          this.wordpress.posts().id(articleId).delete({force: true}).then(resp => {
            Helpers.setLoading(false);
            this.ngOnInit();
            Swal.fire('Succès', "Supprimer avec succès", 'success');
          }).catch(err => {
            Swal.fire('Désolé', 'Une erreur s\'est produit pendant la suppression', 'error');
            Helpers.setLoading(false);
          });
        }
      });
    }
  }

  private formSuccess() {
    Helpers.setLoading(false);
    $('#question-dialog').modal('hide');
    this.newForm.reset();
    this.ngOnInit();
  }

  ngOnInit() {
    Helpers.setLoading(true);
    RSVP.hash({
      categories: this.wordpress.categories().perPage(100),
      posts: this.wordpress.posts().perPage(100)
    }).then(results => {
      Helpers.setLoading(false);
      this.listGroup = _.orderBy(results.categories, 'id', 'desc');
      this.listGroup = _.map(this.listGroup, group => {
        group.name = unescape(group.name);
        return group;
      })
      this.Categories = _.clone(results.categories);
      this.listFaq = results.posts;

      this.cd.detectChanges();
    });
  }

  public faqByGroup(categorieId: number): Array<any> {
    return _.filter(this.listFaq, (faq) => { return _.indexOf(faq.categories, categorieId) >= 0; });
  }

}
