import { Pipe, PipeTransform } from '@angular/core';
import { FzServicesService } from '../_services/fz-services.service';

@Pipe({
  name: 'benefit'
})
export class BenefitPipe implements PipeTransform {
  constructor(
    private services: FzServicesService
  ) {}
  transform(value: any, args?: any): any {
    const price: number = parseInt(value, 10);
    return this.services.manageAlgorithm(price);
  }

}
