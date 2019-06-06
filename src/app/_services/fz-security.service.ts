import { Injectable } from '@angular/core';

@Injectable()
export class FzSecurityService {
  private access: Array<any> = [
    {
      role: 'administrator',
      access: [
        {code: 's1', access: true, name: "Modifier les demandes"},
        {code: 's2', access: true, name: "Supprimer les demandes"},
        {code: 's3', access: true, name: "Modifier le statut des demandes"},
        {code: 's4', access: true, name: "Modifier la marge d'un produit FreeZone"},
      ]
    }
  ];

  constructor() { }

  hasAccess(code: string): boolean {
    return true;
  }

}
