import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { config } from '../../environments/environment';

import { map } from 'rxjs/operators/map';
import * as _ from 'lodash';

@Injectable()
export class AuthorizationService {

  constructor(
    private Http: HttpClient
  ) { }

  public login(email: string, pwd: string): any {
    return this.Http.post<any>(config.jwTokenUrl, { username: email, password: pwd })
      .pipe(
        map(user => {
          if (user && user.token) {
            // Verifier si l'utilisateur est valide
            // Seul les utilisateur valide sont les administrateurs et les éditeurs
            const roles: Array<string> = user.data.roles;
            if (_.indexOf(roles, 'administrator') > -1 || _.indexOf(roles, 'editor') > -1 ||
            _.indexOf(roles, 'author') > -1) {
              localStorage.setItem('__fzCurrentUser', JSON.stringify(user));
            } else {
              return false;
            }
          }
          return user;
        }));
  }

  // Ajouter une function await pour vérifier la validation de l'autorisation
  public isLogged(): boolean {
    let __fzCurrentUser = JSON.parse(localStorage.getItem('__fzCurrentUser'));
    if (__fzCurrentUser && __fzCurrentUser.token) {
      return true;
    } else {
      return false;
    }
  }

  public logout() {
    let __fzCurrentUser = JSON.parse(localStorage.getItem('__fzCurrentUser'));
    if (__fzCurrentUser && __fzCurrentUser.token) {
      localStorage.removeItem('__fzCurrentUser');
      return true;
    } else {
      return false;
    }
  }

  public getCurrentUser() {
    let __fzCurrentUser = JSON.parse(localStorage.getItem('__fzCurrentUser'));
    return __fzCurrentUser;
  }

  public getCurrentUserRole(): string {
    let User: any = this.getCurrentUser();
    return User.data.roles[0];
  }

  public isAdministrator(): boolean {
    const User = this.getCurrentUser();
    const roles: Array<string> = User.data.roles;
    return _.indexOf(roles, 'administrator') > -1;
  }
  
}
