import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import { FzSecurityService } from '../../../_services/fz-security.service';
import { AuthorizationService } from '../../../_services/authorization.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Helpers } from '../../../helpers';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-faq-client-add',
  templateUrl: './faq-client-add.component.html',
  styleUrls: ['./faq-client-add.component.css']
})
export class FaqClientAddComponent implements OnInit {
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
      'https://fonts.googleapis.com/css?family=Montserrat:300,300i,400,400i',
      'https://www.tiny.cloud/css/codepen.min.css'
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
    private router: Router,
    private apiWP: ApiWordpressService,
    private security: FzSecurityService,
    private auth: AuthorizationService,
    private zone: NgZone
  ) {
    this.Wordpress = this.apiWP.getWordpress();
    this.Form = new FormGroup({
      title: new FormControl('', Validators.required),
      content: new FormControl('', Validators.required),
      ctg: new FormControl(null, Validators.required)
    });
   }

  ngOnInit() {

  }

  get f() { return this.Form.controls; }

  onAddFaq(): void {
    if (this.Form.valid) {
      const Value = this.Form.value;
      Helpers.setLoading(true);
      this.Wordpress.faq_client().create({
        status: 'publish',
        title: Value.title,
        content: Value.content,
        faq_category: parseInt(Value.ctg, 10)
      }).then(resp => {
        Helpers.setLoading(false);
        Swal.fire("Succès", "Article FAQ ajouter avec succès", 'success');
        setTimeout(() => {
          this.zone.run(() => { this.router.navigate(['/faq-client', 'view']); });
        }, 2500);
      }).catch(err => {
        Helpers.setLoading(false);
        Swal.fire('Désolé', err, 'error');
      })
    } else {
      (<any>Object).values(this.Form.controls).forEach(element => {
        element.markAsDirty();
      });
    }
  }

}
