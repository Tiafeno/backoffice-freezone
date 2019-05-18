import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { AuthorizationService } from '../../_services/authorization.service';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
declare var $: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
  public formLogin: FormGroup;
  public loading: boolean = false;
  public submitted: boolean = false;
  constructor(
    private auth: AuthorizationService,
    private router: Router
  ) {
    this.formLogin = new FormGroup({
      email: new FormControl('', Validators.required),
      pwd: new FormControl('', Validators.required)
    })
  }

  ngOnInit() {
    $('body').addClass('empty-layout');
  }

  ngAfterViewInit() {
    $('#login-form').validate({
      errorClass: "help-block",
      rules: {
        email: { required: true, email: true },
        password: { required: true }
      },
      highlight: function (e) { $(e).closest(".form-group").addClass("has-error") },
      unhighlight: function (e) { $(e).closest(".form-group").removeClass("has-error") },
    });
  }

  ngOnDestroy() {
    $('body').removeClass('empty-layout');
  }
  get f() { return this.formLogin.controls; }
  onSubmit() {
    this.submitted = true;
    if (this.formLogin.invalid) {
      return;
    }
    this.loading = true;
    this.auth.login(this.formLogin.value.email, this.formLogin.value.pwd)
      .pipe(first())
      .subscribe(
        data => {
          if (data) {
            this.router.navigate(['dashboard']);
          }
          this.loading = false;
        },
        error => {
          this.loading = false;
        });
  }

}
