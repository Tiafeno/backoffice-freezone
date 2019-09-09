import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import { Helpers } from '../../../helpers';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import * as _ from 'lodash';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-faq-client-edit',
  templateUrl: './faq-client-edit.component.html',
  styleUrls: ['./faq-client-edit.component.css']
})
export class FaqClientEditComponent implements OnInit {
  private ID: number = 0;
  private Wordpress;
  public Form: FormGroup;
  public categories: Array<any> = [
    { label: 'Aucun', value: '' },
    { label: "Professionnel", value: 1 },
    { label: "Particulier", value: 2 }
  ];
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

  constructor(
    private route: ActivatedRoute,
    private apiWP: ApiWordpressService
  ) {
    this.Wordpress = this.apiWP.getWordpress();
    this.Form = new FormGroup({
      title: new FormControl('', Validators.required),
      content: new FormControl('', Validators.required),
      ctg: new FormControl(null, Validators.required)
    });
  }

  get f() { return this.Form.controls; }

  ngOnInit() {
    this.route.parent.params.subscribe(params => {
      this.ID = params.id;
      Helpers.setLoading(true);
      this.Wordpress.faq_client().id(this.ID).context('edit').then(faq => {
        const response: any = _.clone(faq);
        Helpers.setLoading(false);
        this.Form.patchValue({
          title: response.title.rendered,
          content: response.content.rendered,
          ctg: _.isEmpty(response.faq_category) ? null : parseInt(response.faq_category, 10)
        });
      }).catch(error => {
        Helpers.setLoading(false);
        Swal.fire('Désolé', error, 'error');
      })
    });
  }

  onUpdateFaq() {
    if (this.Form.valid && this.Form.dirty) {
      const Value: any = this.Form.value;
      Helpers.setLoading(true);
      this.Wordpress.faq_client().id(this.ID).update({
        title: Value.title,
        content: Value.content,
        faq_category: parseInt(Value.ctg, 10)
      }).then(faq => {
        Helpers.setLoading(false);
        Swal.fire('Modification apporté', "Article mis à jour avec succès", 'success');
      })
    } else {
      (<any>Object).values(this.Form.controls).forEach(element => {
        element.markAsDirty();
      });
    }
  }

}
