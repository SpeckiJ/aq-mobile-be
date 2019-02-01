import { Component, OnInit } from '@angular/core';

import { LocateProvider, LocationStatus } from '../../providers/locate/locate';

@Component({
  selector: 'geolocation-enabled',
  templateUrl: 'geolocation-enabled.html'
})
export class GeolocationEnabledComponent implements OnInit {

  public locationMode: LocationStatus;

  constructor(
    private locate: LocateProvider
  ) { }

  public ngOnInit(): void {
    this.locate.getLocationStatusAsObservable().subscribe(res => this.locationMode = res);
  }

  public isActive(): boolean {
    return this.locationMode === LocationStatus.HIGH_ACCURACY;
  }

  public isDeactive(): boolean {
    return this.locationMode === LocationStatus.OFF;
  }

  public isPartial(): boolean {
    return this.locationMode === LocationStatus.BATTERY_SAVING || this.locationMode === LocationStatus.DEVICE_ONLY;
  }

  public isDenied(): boolean {
    return this.locationMode === LocationStatus.DENIED;
  }

  public activateHighAccMode() {
    this.locate.askForHighAccuracy();
  }

}
