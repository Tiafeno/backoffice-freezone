import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import * as moment from 'moment';
import * as _ from 'lodash';
import { Helpers } from '../../helpers';
import { ApiWordpressService } from '../../_services/api-wordpress.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { config } from '../../../environments/environment';
import Swal from 'sweetalert2';
declare var $: any;

@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.css']
})
export class CarouselComponent implements OnInit {
  private Wordpress: any;
  private Table: any;
  public FormUpload: FormGroup;
  public medias: Array<any> = [];
  public viewForm: boolean = false;
  constructor(
    private apiWP: ApiWordpressService,
    private cd: ChangeDetectorRef,
    private http: HttpClient
  ) {
    this.FormUpload = new FormGroup({
      picture: new FormControl(null, Validators.required)
    });
    this.Wordpress = this.apiWP.getWordpress();
  }

  public reload() {
    this.http.get<any>(`${config.apiUrl}/carousel`).subscribe(resp => {
      this.Wordpress.media().include(_.join(resp, ',')).context('edit').perPage(20).then(medias => {
        this.Table.clear().draw();
        this.Table.rows.add(medias);
        this.Table.columns.adjust().draw();

        this.cd.detectChanges();
      });
    });
  }

  ngOnInit() {
    Helpers.setLoading(true);
    this.http.get<any>(`${config.apiUrl}/carousel`).subscribe(resp => {
      this.Wordpress.media().include(_.join(resp, ',')).context('edit').perPage(20).then(medias => {
        Helpers.setLoading(false);
        const DAT = _.reject(medias, (v, k) => { return k == '_paging'; });
        console.log(DAT);
        this.Table = $('#carousel-table').DataTable({
          // Installer le plugin WP Rest Filter (https://fr.wordpress.org/plugins/wp-rest-filter/)
          fixedHeader: true,
          responsive: false,
          "sDom": 'rtip',
          data: DAT,
          columns: [
            {
              data: 'id', render: (data, type, row) => {
                return data;
              }
            },
            {
              data: 'media_details', render: (data) => {
                return `<img class="mr-3 update-thumbnail" src="${data.sizes.shop_thumbnail.source_url}" alt="image" width="60">`
              }
            },
            {
              data: 'date', render: (data) => {
                return data
              }
            },
            {
              data: null, render:(data) => {
                return `<a class="text-light font-16 trash-carousel" ><i class="ti-trash"></i></a>`
              }
            }
          ],
          initComplete: () => {
            $('#carousel-table tbody').on('click', '.trash-carousel', ev => {
              ev.preventDefault();
              let el = $(ev.currentTarget).parents('tr');
              let data = this.Table.row(el).data();
              Swal.fire({
                title: "Confirmation",
                text: "Voulez vous vraiment supprimer cette image?",
                type: 'warning',
                showCancelButton: true
              }).then(result => {
                if (result.value) {
                  Helpers.setLoading(true);
                  this.Wordpress.media().id(data.id).delete({force: true}).then(media => {
                    Helpers.setLoading(false);
                    Swal.fire("Succès", "Image supprimer avec succès", 'success');
                    this.reload();
                  }).catch(err => {
                    Helpers.setLoading(false);
                  })
                }
              });

            });
          }
        });
        this.cd.markForCheck();
      });
    });
  }

  onFileChange(event) {
    if (event.target.files && event.target.files.length) {
      const [file] = event.target.files;
      this.FormUpload.patchValue({
        picture: file
      });

      // need to run CD since file load runs outside of zone
      this.cd.markForCheck();
    }
  }

  uploadMedia(): void {
    if (this.FormUpload.valid) {
      Helpers.setLoading(true);
      this.Wordpress.media()
        // Specify a path to the file you want to upload, or a Buffer
        .file(this.FormUpload.value.picture)
        .create({
          title: 'Slider',
          alt_text: 'slider',
        }).then(resp => {
          const Form = new FormData();
          Form.append('id', resp.id);
          this.http.post<any>(`${config.apiUrl}/carousel`, Form).subscribe(carousel => {
            Helpers.setLoading(false);
            this.cd.markForCheck();
          });
        });
    }
  }

}
