import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { LocateProvider, LocationStatus } from '../../providers/locate/locate';

@Component({
  selector: 'geolocation-enabled',
  templateUrl: 'geolocation-enabled.html'
})
export class GeolocationEnabledComponent implements OnInit, OnDestroy {

  public locStatus: LocationStatus;
  
  private locationStatusSubscriber: Subscription;

  constructor(
    private locate: LocateProvider
  ) { }

  public ngOnInit(): void {
    this.locationStatusSubscriber = this.locate.getLocationStatusAsObservable().subscribe(res => this.locStatus = res);
  }

  public ngOnDestroy(): void {
    if (this.locationStatusSubscriber) { this.locationStatusSubscriber.unsubscribe() };
  }

  public isActive(): boolean {
    return this.locStatus === LocationStatus.HIGH_ACCURACY;
  }

  public isDeactive(): boolean {
    return this.locStatus === LocationStatus.OFF;
  }

  public isPartial(): boolean {
    return this.locStatus === LocationStatus.BATTERY_SAVING || this.locStatus === LocationStatus.DEVICE_ONLY;
  }

  public isDenied(): boolean {
    return this.locStatus === LocationStatus.DENIED;
  }

  public activateHighAccMode() {
    this.locate.askForHighAccuracy();
  }

}
