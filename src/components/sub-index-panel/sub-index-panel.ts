import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { PopoverController } from 'ionic-angular';

import { PhenomenonSeriesID } from '../../model/phenomenon';
import { UserLocation } from '../../providers/user-location-list/user-location-list';
import { SubIndexPanelInformationPopupComponent } from './sub-index-panel-information-popup';

export interface SubIndexEntry {
  label: string,
  id: string,
  index?: string
}

@Component({
  selector: 'sub-index-panel',
  templateUrl: 'sub-index-panel.html'
})
export class SubIndexPanelComponent implements OnChanges {

  @Output()
  public onSelect: EventEmitter<string> = new EventEmitter();

  @Output()
  public onReady: EventEmitter<void> = new EventEmitter();

  @Input()
  public location: UserLocation;

  public entries: SubIndexEntry[] = [
    {
      label: 'NO2',
      id: PhenomenonSeriesID.NO2
    },
    {
      label: 'O3',
      id: PhenomenonSeriesID.O3
    },
    {
      label: 'PM10',
      id: PhenomenonSeriesID.PM10
    },
    {
      label: 'PM2.5',
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
    this.popoverCtrl.create(SubIndexPanelInformationPopupComponent).present({ ev: myEvent });
  }

  public entryReady() {
    this.readyCounter--;
    if (this.readyCounter === 0) {
      this.onReady.emit();
    }
  }

}
