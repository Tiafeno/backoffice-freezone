import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { config } from '../../../../environments/environment';
import Swal from 'sweetalert2';
import { FAI } from '../../../defined';
import * as _ from 'lodash';
import { FzServicesService } from '../../../_services/fz-services.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-wpoptions',
  templateUrl: './wpoptions.component.html',
  styleUrls: ['./wpoptions.component.css']
})
export class WpoptionsComponent implements OnInit {
  public formOptions: FormGroup;
  public loading: boolean = false;
  public fai: Array<any>;
  constructor(
    private services: FzServicesService,
    private fb: FormBuilder,
    private Http: HttpClient,
    private detector: ChangeDetectorRef
  ) {
    this.fai = FAI;
    this.formOptions = this.fb.group({
      nif: ['', Validators.required],
      stat: ['', Validators.required],
      rc: ['', Validators.required],
      cif: ['', Validators.required],
      bmoi: ['', Validators.required],
      phones: this.fb.array([]) // fai and number
    });
  }

  get fPhone(): FormArray { return this.formOptions.get('phones') as FormArray; }

  ngOnInit() {
    this.loading = true;
    this.Http.get<any>(`${config.apiUrl}/options`).pipe(map(item => {
      item.phones = JSON.parse(item.phones);
      return item;
    })).subscribe(resp => {
      this.loading = false;
      const { nif, stat, rc, cif, bmoi } = resp;
      this.formOptions.patchValue({
        nif: nif, stat: stat, rc: rc,
        cif: cif, bmoi: bmoi
      });

      const { phones } = resp;
      if (!_.isEmpty(phones)) {
        phones.forEach(element => {
          this.phone = element;
        });
      } else {
        this.addPhoneNumber();
      }
    });
  }

  viewChange() {}

  set phone(value: {fai: any, number: any}) {
    const id: string = this.services.generateId(10);
    this.fPhone.push(this.fb.group({
      fai: new FormControl(value.fai, Validators.required),
      number: new FormControl(value.number, Validators.required),
      _id: id
    }));
  }

  addPhoneNumber() {
    const id: string = this.services.generateId(10);
    this.fPhone.push(this.fb.group({ 
      fai: new FormControl('', Validators.required), 
      number: new FormControl('', Validators.required), 
      _id: id 
    }));
    this.detector.detectChanges();
  }

  removePhoneNumber(ev: MouseEvent, index) {
    ev.preventDefault();
    this.fPhone.removeAt(index); // Effacer une ligne dans le form array
  }

  saveOptions(ev: any): boolean {
    ev.preventDefault();
    if (this.formOptions.dirty && this.formOptions.valid) {
      let { nif, stat, rc, cif, bmoi, phones } = this.formOptions.value;
      console.log(phones);
      const formData = new FormData();
      formData.append('nif', nif);
      formData.append('stat', stat);
      formData.append('rc', rc);
      formData.append('cif', cif);
      formData.append('bmoi', bmoi);
      formData.append('phones', JSON.stringify(phones));
      this.loading = true;
      this.Http.post<any>(`${config.apiUrl}/options`, formData).subscribe(resp => {
        this.loading = false;
        Swal.fire("", resp.data, 'info');
      });
    }
    return false;
  }

}
