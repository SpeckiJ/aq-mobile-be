import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { PopoverController } from 'ionic-angular';

import { PhenomenonSeriesID } from '../../model/phenomenon';
import { AnnualPhenomenonMapping } from '../../providers/annual-mean/annual-mean';
import { UserLocation } from '../../providers/user-location-list/user-location-list';
import { AnnualMeanPanelInformationPopupComponent } from './annual-mean-panel-information-popup';

export interface AnnualMeanEntry {
  label: string,
  phenomenon: AnnualPhenomenonMapping;
  id: string
}

@Component({
  selector: 'annual-mean-panel',
  templateUrl: 'annual-mean-panel.html'
})
export class AnnualMeanPanelComponent implements OnChanges {

  @Output()
  public onSelect: EventEmitter<string> = new EventEmitter();

  @Output()
  public onReady: EventEmitter<void> = new EventEmitter();

  @Input()
  public location: UserLocation;

  public entries: AnnualMeanEntry[] = [
    {
      label: 'NO2',
      phenomenon: AnnualPhenomenonMapping.NO2,
      id: PhenomenonSeriesID.NO2
    },
    {
      label: 'PM10',
      phenomenon: AnnualPhenomenonMapping.PM10,
      id: PhenomenonSeriesID.PM10
    },
    {
      label: 'PM2.5',
      phenomenon: AnnualPhenomenonMapping.PM25,
      id: PhenomenonSeriesID.PM25
    }
  ];

  private readyCounter: number;

  constructor(
    private popoverCtrl: PopoverController
  ) { }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.location) {
      this.readyCounter = this.entries.length;
    }
  }

  public select(id: string) {
    this.onSelect.emit(id);
  }

  public presentPopover(myEvent) {
    this.popoverCtrl.create(AnnualMeanPanelInformationPopupComponent).present({ ev: myEvent });
  }

  public entryReady() {
    this.readyCounter--;
    if (this.readyCounter === 0) {
      this.onReady.emit();
    }
  }

}
