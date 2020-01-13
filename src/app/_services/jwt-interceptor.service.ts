import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/do';
import 'rxjs/add/observable/throw';
import Swal from 'sweetalert2';

@Injectable()
export class JwtInterceptorService implements HttpInterceptor {

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let __fzCurrentUser = JSON.parse(localStorage.getItem('__fzCurrentUser'));
    if (__fzCurrentUser && __fzCurrentUser.token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${__fzCurrentUser.token}`
        }
      })
    }
    return next.handle(request).do(event => { }, err => {
      if (err instanceof HttpErrorResponse) { // here you can even check for err.status == 404 | 401 etc
        if (err.status == 401 || err.status == 511 || err.status == 500) {
            this.logOut();
        } else {
          console.log(err);
          if (err.error.code === 'jwt_auth_invalid_token') {
            setTimeout(() => {
              this.logOut();
            }, 1500);
          } else {
            Swal.fire('Erreur', err.message, 'error');
          }
        }
        Observable.throw(err); // send data to service which will inform the component of the error and in turn the user
      }
    });
  }

  public logOut() {
    localStorage.removeItem('__fzCurrentUser');
    location.reload();
  }

}
