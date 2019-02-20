import { AfterViewInit, Component, EventEmitter, Input, Output } from '@angular/core';
import invert from 'invert-color';
import { map } from 'rxjs/operators';

import { AnnualMeanProvider } from '../../providers/annual-mean/annual-mean';
import { UserLocation } from '../../providers/user-location-list/user-location-list';
import { AnnualMeanEntry } from './annual-mean-panel';

@Component({
  selector: '[annual-mean-panel-entry]',
  templateUrl: 'annual-mean-panel-entry.html'
})
export class AnnualMeanPanelEntryComponent implements AfterViewInit {

  public color: string;
  public backgroundColor: string;

  public loading: boolean = true;

  @Input()
  public entry: AnnualMeanEntry;

  @Input()
  public location: UserLocation;

  @Output()
  public onSelect: EventEmitter<string> = new EventEmitter();

  constructor(
    private annualMeanProvider: AnnualMeanProvider
  ) { }

  public ngAfterViewInit(): void {
    this.annualMeanProvider.getYear().subscribe(year => {
      this.annualMeanProvider.getValue(this.location.latitude, this.location.longitude, year, this.entry.phenomenon)
        .pipe(map(value => this.annualMeanProvider.getCategorizeColor(this.entry.phenomenon, value)))
        .subscribe(res => {
          this.backgroundColor = res;
          this.color = invert(this.backgroundColor, true);
          this.loading = false;
        })
    })
  }

  public select() {
    this.onSelect.emit(this.entry.id);
  }

}
