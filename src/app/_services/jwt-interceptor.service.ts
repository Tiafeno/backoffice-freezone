import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/do';

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
    console.log(__fzCurrentUser);
    return next.handle(request).do(event => { }, err => {
      if (err instanceof HttpErrorResponse) { // here you can even check for err.status == 404 | 401 etc
        if (err.status == 401 || err.status == 511 || err.status == 500) {
          setTimeout(() => {
            //localStorage.removeItem('currentUser');
            location.reload();
            localStorage.removeItem('__fzCurrentUser');
          }, 1500);
        }
        Observable.throw(err); // send data to service which will inform the component of the error and in turn the user
      }
    });
  }

}
