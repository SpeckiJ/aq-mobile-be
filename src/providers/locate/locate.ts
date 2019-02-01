import { Injectable } from '@angular/core';
import { GeoReverseResult, GeoSearch } from '@helgoland/map';
import { Diagnostic } from '@ionic-native/diagnostic';
import { Geolocation, Geoposition, PositionError } from '@ionic-native/geolocation';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { TranslateService } from '@ngx-translate/core';
import { Platform, ToastController } from 'ionic-angular';
import { Observable, Observer, ReplaySubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export const enum LocationStatus {
  HIGH_ACCURACY = 'HIGH_ACCURACY',
  BATTERY_SAVING = 'BATTERY_SAVING',
  DEVICE_ONLY = 'DEVICE_ONLY',
  OFF = 'OFF',
  DENIED = 'DENIED'
}

const LOCATE_MAXIMUM_AGE = 1000 * 60 * 3; // 3 minutes
const LOCATE_TIMEOUT_HIGH_ACCURACY = 1000 * 30 // 30 seconds
const LOCATE_TIMEOUT_DEVICE_ONLY = 1000 * 30 // 30 seconds
const LOCATE_TIMEOUT_BATTERY_SAVING = 1000 * 30 // 30 seconds
const LOCATE_TIMEOUT_UNTIL_HIGH_ACC_REQUEST = 1000 * 3 // 3 seconds

@Injectable()
export class LocateProvider {

  private locationStatusReplay: ReplaySubject<LocationStatus> = new ReplaySubject(1);
  private locationStatus: LocationStatus;

  constructor(
    private platform: Platform,
    private geolocate: Geolocation,
    private diagnostic: Diagnostic,
    private translate: TranslateService,
    private toast: ToastController,
    private geosearch: GeoSearch,
    private locationAccuracy: LocationAccuracy
  ) {
    this.registerLocationStateChangeHandler();
    this.isGeolocationEnabled();
    this.platform.resume.subscribe(() => this.isGeolocationEnabled());
  }

  /**
   * Returns the location state as Observable.
   */
  public getLocationStatusAsObservable(): Observable<LocationStatus> {
    return this.locationStatusReplay.asObservable();
  }

  /**
   * Return the current state of enabled location.
   */
  public getLocationStatus(): LocationStatus {
    return this.locationStatus;
  }

  private registerLocationStateChangeHandler() {
    if (this.platform.is('cordova')) {
      this.diagnostic.registerLocationStateChangeHandler(() => {
        this.isGeolocationEnabled();
        this.diagnostic.isLocationEnabled().then((res) => {
          const message = res ? this.translate.instant('network.geolocationEnabled') : this.translate.instant('network.geolocationDisabled');
          this.toast.create({ message, duration: 5000 }).present();
        })
      });
    }
  }

  private isGeolocationEnabled() {
    if (this.platform.is('cordova')) {
      this.diagnostic.isLocationEnabled().then((res) => {
        if (this.platform.is('android')) {
          this.diagnostic.isLocationAuthorized().then(locAuthorized => {
            if (locAuthorized) {
              this.diagnostic.getLocationMode().then(locMode => {
                switch (locMode) {
                  case this.diagnostic.locationMode.HIGH_ACCURACY:
                    this.setLocationMode(LocationStatus.HIGH_ACCURACY);
                    break;
                  case this.diagnostic.locationMode.BATTERY_SAVING:
                    this.setLocationMode(LocationStatus.BATTERY_SAVING);
                    break;
                  case this.diagnostic.locationMode.DEVICE_ONLY:
                    this.setLocationMode(LocationStatus.DEVICE_ONLY);
                    break;
                  case this.diagnostic.locationMode.LOCATION_OFF:
                    this.setLocationMode(LocationStatus.OFF);
                    break;
                }
              }, error => this.setLocationMode(LocationStatus.OFF));
            } else {
              this.setLocationMode(LocationStatus.DENIED);
            }
          })
        }
        if (this.platform.is('ios') && res) {
          this.setLocationMode(LocationStatus.HIGH_ACCURACY);
        } else {
          this.setLocationMode(LocationStatus.OFF);
        }
      });
    } else {
      // in browser
      this.setLocationMode(LocationStatus.HIGH_ACCURACY);
    }
  }

  private setLocationMode(mode: LocationStatus) {
    this.locationStatus = mode;
    this.locationStatusReplay.next(this.locationStatus);
  }

  // public determinePosition(): Observable<Geoposition> {
  //   this.locationAccuracy.canRequest().then((canRequest: boolean) => {
  //     if(canRequest) {
  //       // the accuracy option will be ignored by iOS
  //       this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
  //         () => console.log('Request successful'),
  //         error => console.log('Error requesting location permissions', error)
  //       );
  //     }
  //   });

  //   return new Observable((observer: Observer<Geoposition>) => {
  //     this.platform.ready().then(() => {
  //       this.geolocate.getCurrentPosition({
  //         timeout: 30000,
  //         maximumAge: 0,
  //         enableHighAccuracy: true
  //       }).then(res => {
  //         observer.next(res);
  //         observer.complete();
  //       }).catch((error) => {
  //         let errorMessage: string;
  //         if (error && error.message) {
  //           errorMessage = error.message;
  //         } else {
  //           errorMessage = JSON.stringify(error);
  //         }
  //         observer.error(error);
  //         observer.complete();
  //         this.toast.create({ message: `Error occured, while fetching location: ${errorMessage}`, duration: 3000 }).present();
  //       });
  //     })
  //   })
  // }

  public getUserLocation(askForPermission?: boolean): Observable<Geoposition> {
    return new Observable((observer: Observer<Geoposition>) => {
      if (this.locationStatus !== LocationStatus.DENIED || askForPermission) {
        if (this.platform.is('cordova')) {
          this.platform.ready().then(() => {
            this.diagnostic.isLocationEnabled().then(enabled => {
              if (enabled) {
                if (this.platform.is('android')) {
                  this.diagnostic.getLocationMode().then(locationMode => {
                    // high accuracy => do locate
                    if (locationMode === this.diagnostic.locationMode.HIGH_ACCURACY) {
                      this.getCurrentLocation(observer);
                    }
                    // location off
                    if (locationMode === this.diagnostic.locationMode.LOCATION_OFF) {
                      this.askForHighAccuracy().then(
                        () => this.getCurrentLocation(observer),
                        error => this.processError(observer, error)
                      )
                    }
                    // device only or battery saving
                    else {
                      // TODO add timeout check and request afterwards
                    }
                  });
                } else {
                  this.getCurrentLocation(observer);
                }
              } else {
                this.askForHighAccuracy().then(
                  () => this.getCurrentLocation(observer),
                  error => this.processError(observer, error))
              }
            }, error => this.processError(observer, error));
          });
        } else {
          this.getCurrentLocation(observer);
        }
      }
    });
  }

  private getCurrentLocation(observer: Observer<Geoposition>) {
    this.geolocate.getCurrentPosition({ timeout: 30000, maximumAge: LOCATE_MAXIMUM_AGE, enableHighAccuracy: true })
      .then(pos => this.processComplete(observer, pos))
      .catch(error => this.processError(observer, error));
  }

  private processComplete(observer: Observer<Geoposition>, position: Geoposition) {
    observer.next(position);
    observer.complete();
  }

  private processError(observer: Observer<Geoposition>, error: PositionError) {
    // permission denied
    if (error.code === 1) { this.setLocationMode(LocationStatus.DENIED); }
    // position unavailable
    if (error.code === 2) { }
    // timeout
    if (error.code === 3) { }
    console.error(`Code: ${error.code}, Message ${error.message}`);
    observer.error(error.message);
    observer.complete();
  }

  public askForHighAccuracy(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.locationAccuracy
        .request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
          () => resolve(),
          error => reject('High Accuracy permission denied')
        );
    });
  }

  public determineGeoLocation(askForPermission?: boolean): Observable<GeoReverseResult> {
    return this.getUserLocation(askForPermission).pipe(switchMap(location =>
      this.geosearch.reverse(
        { type: 'Point', coordinates: [location.coords.latitude, location.coords.longitude] },
        { acceptLanguage: this.translate.currentLang }
      )
    ))
  }
}
