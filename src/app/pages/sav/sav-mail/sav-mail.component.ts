import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiWordpressService } from '../../../_services/api-wordpress.service';
import { Helpers } from '../../../helpers';
import * as _ from 'lodash';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthorizationService } from '../../../_services/authorization.service';
import { HttpClient } from '@angular/common/http';
import { config } from '../../../../environments/environment';
import Swal from 'sweetalert2';
declare var $: any;

@Component({
  selector: 'app-sav-mail',
  templateUrl: './sav-mail.component.html',
  styleUrls: ['./sav-mail.component.css']
})
export class SavMailComponent implements OnInit {
  private savID: number = 0;
  private queryMail: any;
  public pagination: any = {};
  private Wordpress: any;
  public Mails: Array<any> = [];
  public currentPage: number = 1;
  public paginationContainer: any;
  public perPage: number = 20;
  public formNewMail: FormGroup;
  public viewMail: any = false;
  public isAdmin: boolean = false;

  public dataOnlineUser: any = false;
  public savStatus: Array<{ key: number, value: string }> = [
    { key: 1, value: 'Diagnostic réalisé' },
    { key: 2, value: 'Diagnostic non réalisé' },
    { key: 3, value: 'A réparer' },
    { key: 4, value: 'Ne pas réparer' },
    { key: 5, value: 'Terminer' },
  ];
  constructor(
    private route: ActivatedRoute,
    private apiWp: ApiWordpressService,
    private cd: ChangeDetectorRef,
    private auth: AuthorizationService,
    private Http: HttpClient
  ) {
    this.Wordpress = this.apiWp.getWordpress();
    this.queryMail = this.Wordpress.mailing();
    this.formNewMail = new FormGroup({
      subject: new FormControl('', Validators.required),
      message: new FormControl('', Validators.required)
    });
    this.dataOnlineUser = this.auth.getCurrentUser().data;
    this.isAdmin = this.auth.isAdministrator();
  }

  ngOnInit() {
    this.paginationContainer = $('#pagination');
    this.route.parent.params.subscribe(params => {
      this.savID = params.id;
      this.queryMail = this.queryMail
        .status('any')
        .context('edit')
        .param('meta_key', "attach_post")
        .param('meta_value', this.savID)
        .perPage(this.perPage);
      this.getQuery()
    });
  }

  public onSubmitNewMail() {
    if (this.formNewMail.valid) {
      const onlineUserId: number = this.dataOnlineUser.ID;
      const Value: any = this.formNewMail.value;
      const args = {
        status: 'draft',
        title: Value.subject,
        content: Value.message,
        attach_post: this.savID,
        sender: onlineUserId,
        response_post: 0
      };
      Helpers.setLoading(true);
      // Crée le historique
      this.Wordpress.mailing().create(args).then(resp => {
        const Form: FormData = new FormData();
        Form.append('sender', onlineUserId.toString());
        Form.append('sav_id', this.savID.toString());
        Form.append('subject', Value.subject);
        Form.append('message', Value.message);
        Form.append('mailing_id', resp.id.toString());
        // Envoyer le mail
        this.Http.post<any>(`${config.apiUrl}/mail/sav/${this.savID}`, Form).subscribe(resp => {
          Helpers.setLoading(false);
          this.onRefreshResults();
        });

      });
    } else {
      (<any>Object).values(this.formNewMail.controls).forEach(element => {
        element.markAsTouched();
      });
    }
  }

  public openViewMail($event: any, mail: any) {
    $event.preventDefault();
    this.viewMail = _.clone(mail);
    this.cd.detectChanges();
  }

  /**
   * Actualisez la liste apres l'ajout d'un nouveau article
   */
  onRefreshResults() {
    this.queryMail = this.queryMail.page(this.currentPage);
    this.getQuery();
  }

  /**
   * Cete fonction permet de changeer les resultats quand on change de page
   * dans la pagination.
   * @param $page
   */
  onChangePage($page: number): void {
    this.queryMail = this.queryMail.page($page);
    this.currentPage = $page;
    this.getQuery();
  }

  public isNumber(val) { return typeof val === 'number'; }

  public removeMail(id: number) {
    if (this.isAdmin) {
      Swal.fire({
        title: 'Confirmation',
        html: "voulez vous vraiment supprimer ce message?",
        confirmButtonText: 'Oui',
        cancelButtonText: 'Annuler',
        showCancelButton: true,
      }).then(result => {
        if (result.value) {
          $('#mail-view-modal').modal('hide');
          Helpers.setLoading(true);
          this.Wordpress.mailing().id(id).delete({ force: true }).then(resp => {
            Helpers.setLoading(false);
            this.onRefreshResults();
          });
        }
      });


    } else {
      Swal.fire('Autorisation', "Vous n'avez pas l'autorisation de supprimer un historique", 'error');
    }
  }

  private getQuery() {
    Helpers.setLoading(true);
    this.queryMail.headers().then(headers => {
      this.pagination._totalPages = parseInt(headers['x-wp-totalpages'], 10);
      this.pagination._total = parseInt(headers['x-wp-total'], 10);
      this.queryMail.then(mails => {
        Helpers.setLoading(false);
        this.Mails = _.map(mails, mail => {
          mail.sav = _.isNull(mail.sav_status) || _.isEmpty(mail.sav_status) ? 'Diagnostic non réalisé'
            : _.find(this.savStatus, { key: parseInt(mail.sav_status) }).value;
          return mail;
        });
        this.cd.detectChanges();
        this.paginationContainer.pagination({
          dataSource: _.range(this.pagination._total),
          totalNumber: this.pagination._total,
          pageNumber: this.currentPage,
          pageSize: this.perPage,
          showPrevious: false,
          showNext: false,
          ulClassName: 'pagination justify-content-center',
          className: 'page-item',
          activeClassName: 'active',
          afterPageOnClick: (data, pagination) => {
            this.onChangePage(parseInt(pagination, 10));
          },
          afterRender: (data, pagination) => {

          }
        });
      });
    }).catch(err => {
      Helpers.setLoading(false);
    });
  }

}
