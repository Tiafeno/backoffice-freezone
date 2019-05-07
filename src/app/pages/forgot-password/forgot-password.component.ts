import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';

declare var $:any;

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent implements OnInit, AfterViewInit, OnDestroy {

  constructor() { }

  ngOnInit() {
    $('body').addClass('empty-layout');
  }

  ngAfterViewInit() {
    $('#forgot-form').validate({
        errorClass: "help-block",
        rules: {
            email: {
                required: true,
                email: true
            },
        },
        highlight: function(e) {
            $(e).closest(".form-group").addClass("has-error")
        },
        unhighlight: function(e) {
            $(e).closest(".form-group").removeClass("has-error")
        },
    });
  }

  ngOnDestroy() {
    $('body').removeClass('empty-layout');
  }

}
