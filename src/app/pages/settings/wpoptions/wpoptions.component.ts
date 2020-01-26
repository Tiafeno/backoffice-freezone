import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { config } from '../../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-wpoptions',
  templateUrl: './wpoptions.component.html',
  styleUrls: ['./wpoptions.component.css']
})
export class WpoptionsComponent implements OnInit {
  public formOptions: FormGroup
  public loading:boolean = false;
  constructor(
    private fb: FormBuilder,
    private Http: HttpClient,
    private detector: ChangeDetectorRef
  ) {
    this.formOptions = this.fb.group({
      nif: ['', Validators.required],
      stat: ['', Validators.required],
      rc: ['', Validators.required],
      cif: ['', Validators.required],
      bmoi: ['', Validators.required]
    })
   }

  ngOnInit() {
    this.loading = true;
    this.Http.get<any>(`${config.apiUrl}/options`).subscribe(resp => {
      this.loading = false;
      this.formOptions.patchValue(resp)
    });
  }

  saveOptions(ev: any): boolean {
    ev.preventDefault();
    if (this.formOptions.dirty && this.formOptions.valid) {
      let {nif, stat, rc, cif, bmoi} = this.formOptions.value;
      const formData = new FormData();
      formData.append('nif', nif);
      formData.append('stat', stat);
      formData.append('rc', rc);
      formData.append('cif', cif);
      formData.append('bmoi', bmoi);
      this.loading = true;
      this.Http.post<any>(`${config.apiUrl}/options`, formData).subscribe(resp => {
        this.loading = false;
        Swal.fire("", resp.data, 'info');
      });
    } 
    return false;
  }

}
