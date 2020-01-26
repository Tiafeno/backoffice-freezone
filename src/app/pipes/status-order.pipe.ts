import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'lodash';

@Pipe({
  name: 'statusOrder'
})
export class StatusOrderPipe implements PipeTransform {

  transform(position: any, args?: any): any {
    const STATUS: Array<{value: number, label: string, style: string}> = [
      { value: 0, label: 'En ettente', style: 'warning' },
      { value: 1, label: 'Envoyer', style: 'blue' },
      { value: 2, label: 'Rejeté', style: 'danger' },
      { value: 3, label: 'Accepté', style: 'success' },
      { value: 4, label: 'Terminé', style: 'success' },
    ];
    let status: any = _.find(STATUS, { value: parseInt(position) });
    if (_.isUndefined(status)) return 'Non definie';
    return `<span class="badge badge-${status.style} status-switcher">${status.label}</span>`;
  }

}
