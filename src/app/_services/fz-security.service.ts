import { Injectable } from '@angular/core';
import { AuthorizationService } from './authorization.service';
import * as _ from 'lodash';
import Swal from 'sweetalert2';

@Injectable()
export class FzSecurityService {
  public codes: Array<any> = [
    { code: 's1', name: "Modifier les demandes" },
    { code: 's2', name: "Supprimer les demandes" },
    { code: 's3', name: "Modifier le statut des demandes" },
    { code: 's4', name: "Modifier la marge d'un produit FreeZone" },
    { code: 's5', name: "Modifier la marge revendeur d'un produit FreeZone" },
    { code: 's6', name: "Modifier une article" },
    { code: 's7', name: "Supprimer une article" },
    { code: 's8', name: "Envoyer le devis par mail" },
    { code: 's9', name: "Ajouter un article" },
    { code: 's10', name: "Modifier un article" },
    { code: 's11', name: "Modifier le type du client" },
    { code: 's12', name: "Supprimer un client" },
    { code: 's13', name: "Modifier le statut du client" },
    { code: 's14', name: "Ajouter ou Remplacer les images des articles" },
    { code: 's15', name: "Modifier la status du SAV" },
    { code: 's16', name: "Modifier la date approcimative du SAV" },
  ];
  private access: Array<object> = [
    {
      role: 'administrator',
      access: [
        { code: 's1', access: true },
        { code: 's2', access: true },
        { code: 's3', access: true },
        { code: 's4', access: true },
        { code: 's5', access: true },
        { code: 's6', access: true },
        { code: 's7', access: true },
        { code: 's8', access: true },
        { code: 's9', access: true },
        { code: 's10', access: true },
        { code: 's11', access: true },
        { code: 's12', access: true },
        { code: 's13', access: true },
        { code: 's14', access: true },
        { code: 's15', access: true },
        { code: 's16', access: true },
      ]
    },
    {
      role: 'editor',
      access: [
        { code: 's1', access: true },
        { code: 's2', access: false },
        { code: 's3', access: false },
        { code: 's4', access: false },
        { code: 's5', access: false },
        { code: 's6', access: false },
        { code: 's7', access: false },
        { code: 's8', access: true },
        { code: 's9', access: false },
        { code: 's10', access: false },
        { code: 's11', access: false },
        { code: 's12', access: false },
        { code: 's13', access: false },
        { code: 's14', access: false },
        { code: 's15', access: false },
        { code: 's16', access: false },
      ]
    },
    {
      role: 'author',
      access: [
        { code: 's1', access: true },
        { code: 's2', access: false },
        { code: 's3', access: false },
        { code: 's4', access: false },
        { code: 's5', access: false },
        { code: 's6', access: false },
        { code: 's7', access: false },
        { code: 's8', access: true },
        { code: 's9', access: false },
        { code: 's10', access: false },
        { code: 's11', access: false },
        { code: 's12', access: false },
        { code: 's13', access: false },
        { code: 's14', access: true },
        { code: 's15', access: true },
        { code: 's16', access: true },
      ]
    }
  ];

  constructor(
    private authorization: AuthorizationService
  ) { }

  hasAccess(code: string, dialog?: boolean): boolean {
    let fireSwal: boolean = _.isUndefined(dialog) ? true : dialog;
    const __role:string = this.authorization.getCurrentUserRole();
    let role_access: any = _.find(this.access, {'role': __role });
    let access: any = _.find(role_access.access, {'code': code});
    if (_.isUndefined(access) || _.isEmpty(access)) return true;

    if ( ! access.access && fireSwal) {
      Swal.fire("Accès", "Accès non-autorisé", "warning");
    }
    return access.access;
  }

}
