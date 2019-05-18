import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'moments'
})
export class MomentsPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    return null;
  }

}
