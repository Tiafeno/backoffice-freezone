import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormControl, FormArray } from '@angular/forms';
import { DataServicesService } from '../../_services/data-services.service';
import * as _ from "lodash";
import { Taxonomy, TermAttribute } from '../../taxonomy';

@Component({
  selector: 'app-attributes',
  templateUrl: './attributes.component.html',
  styleUrls: ['./attributes.component.css']
})
export class AttributesComponent implements OnInit {
  public terms: any = {};
  public attributeTaxonomies: Array<TermAttribute>;
  public attributeTerms: any[];
  public productAttributes: any[] = [];
  private id: number = 0
  @Input('product-attributes') set productattr(value: any[]) {
    if (_.isEmpty(value)) return;
    this.productAttributes = value;
    for (let attribute of this.productAttributes) {
      // Terms pour une attribue definie dans le parametre
      this.terms[attribute.id] = this.dataServices.getAttributeTerms(attribute.id);
      this.attributes.push(new FormGroup({
        id: new FormControl(attribute.id),
        name: new FormControl(attribute.name),
        options: new FormControl(attribute.options)
      }));
    }
  }
  @Input('articleId') set attrId(value: number) { this.id = value; }
  get attrId(): number { return this.id; }
  public form: FormGroup;
  constructor(private dataServices: DataServicesService) {
    this.form = new FormGroup({
      attribute_taxonomy: new FormControl(''),
      attributes: new FormArray([])
    });
  }

  get attributes() { return this.form.get('attributes') as FormArray; }

  addAttribute(ev: MouseEvent) {
    ev.preventDefault();
    const attributeTaxonomy: number = parseInt(this.form.get('attribute_taxonomy').value);
    let tax = _.find(this.attributeTaxonomies, { id: attributeTaxonomy });
    if (_.isUndefined(tax)) return false;
    // Terms pour une attribue definie dans le parametre
    this.terms[tax.id] = this.dataServices.getAttributeTerms(tax.id);
    // Verifier si l'attribut est deja dans la liste
    let listAttrIds = _(this.attributes.value).map((attrFm: any) => {
      return parseInt(attrFm.id);
    }).value();
    if (_.indexOf(listAttrIds, tax.id) > -1) {
      window.alert("vous avez deja ajouter cette attribut");
      return false
    }
    this.attributes.push(new FormGroup({
      id: new FormControl(tax.id),
      name: new FormControl(tax.name),
      options: new FormControl([])
    }));
  }

  removeAttribute(ev: MouseEvent, index: number) {
    ev.preventDefault();
    this.attributes.removeAt(index);
  }

  async ngOnInit() {
    // Recuperer tous les attributs existants
    await this.dataServices.getProductsAttributes().subscribe(atts => {
      this.attributeTaxonomies = _.clone(atts);
    });

  }

}
