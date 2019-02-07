import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { PopoverController } from 'ionic-angular';

import { UserLocation } from '../../providers/user-location-list/user-location-list';
import { NearestMeasuringStationPanelInformationPopupComponent } from './nearest-measuring-station-panel-information-popup';

interface PanelEntry {
  label: string;
  id: string;
}

@Component({
  selector: 'nearest-measuring-station-panel',
  templateUrl: 'nearest-measuring-station-panel.html'
})
export class NearestMeasuringStationPanelComponent implements OnChanges {

  @Output()
  public onSelect: EventEmitter<string> = new EventEmitter();

  @Output()
  public onReady: EventEmitter<void> = new EventEmitter();

  @Input()
  public location: UserLocation;

  public entries: PanelEntry[] = [
    {
      label: 'BC',
      id: '391'
    },
    {
      label: 'NO2',
      id: '8'
    },
    {
      label: 'O3',
      id: '7'
    },
    {
      label: 'PM10',
      id: '5'
    },
    {
      label: 'PM2.5',
      id: '6001'
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
    this.popoverCtrl.create(NearestMeasuringStationPanelInformationPopupComponent).present({ ev: myEvent });
  }

  public entryReady() {
    this.readyCounter--;
    if (this.readyCounter === 0) {
      this.onReady.emit();
    }
  }

}
