import { HttpClient, HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, ErrorHandler, Injector, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { DatasetApiInterface, SettingsService } from '@helgoland/core';
import { HelgolandD3Module } from '@helgoland/d3';
import { HelgolandDatasetlistModule } from '@helgoland/depiction';
import { GeoSearch, HelgolandMapControlModule, HelgolandMapSelectorModule, HelgolandMapViewModule } from '@helgoland/map';
import { AppVersion } from '@ionic-native/app-version';
import { BackgroundMode } from '@ionic-native/background-mode';
import { Diagnostic } from '@ionic-native/diagnostic';
import { FCM } from '@ionic-native/fcm';
import { Geolocation } from '@ionic-native/geolocation';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { LocalNotifications } from '@ionic-native/local-notifications';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { Network } from '@ionic-native/network';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { IonicStorageModule } from '@ionic/storage';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { IonAffixModule } from 'ion-affix';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { CacheModule } from 'ionic-cache';

import { ComponentsModule } from '../components/components.module';
import { DiagramModule } from '../pages/diagram/diagram.module';
import { IntroPage } from '../pages/intro/intro';
import { MapModule } from '../pages/map/map.module';
import { SettingsModule } from '../pages/settings/settings.module';
import { StartPage } from '../pages/start/start';
import { AirQualityIndexProvider } from '../providers/air-quality-index/air-quality-index';
import { AnnualMeanProvider } from '../providers/annual-mean/annual-mean';
import { BelaqiIndexProvider } from '../providers/belaqi/belaqi';
import { CategorizeValueToIndexProvider } from '../providers/categorize-value-to-index/categorize-value-to-index';
import { CustomDatasetApiInterface } from '../providers/custom-dataset-api-interface/custom-dataset-api-interface';
import { GeoLabelsProvider } from '../providers/geo-labels/geo-labels';
import { GeoSearchService } from '../providers/geo-search/geo-search';
import { IrcelineSettingsProvider } from '../providers/irceline-settings/irceline-settings';
import { LanguageHandlerProvider, languageInitializerFactory } from '../providers/language-handler/language-handler';
import { LayerGeneratorService } from '../providers/layer-generator/layer-generator';
import { LocateProvider } from '../providers/locate/locate';
import { ModelledValueProvider } from '../providers/modelled-value/modelled-value';
import { NearestTimeseriesManagerProvider } from '../providers/nearest-timeseries-manager/nearest-timeseries-manager';
import { NearestTimeseriesProvider } from '../providers/nearest-timeseries/nearest-timeseries';
import { NotificationMaintainerProvider } from '../providers/notification-maintainer/notification-maintainer';
import { NotificationPresenter } from '../providers/notification-presenter/notification-presenter';
import { PersonalAlertsProvider } from '../providers/personal-alerts/personal-alerts';
import { DatasetOptionsModifier } from '../providers/phenomenon-options-mapper/phenomenon-options-mapper';
import { PushNotificationsProvider } from '../providers/push-notifications/push-notifications';
import { RefreshHandler } from '../providers/refresh/refresh';
import { JSSONSettingsService } from '../providers/settings/settings';
import { LocatedTimeseriesService } from '../providers/timeseries/located-timeseries';
import { TimeseriesService } from '../providers/timeseries/timeseries';
import { UserTimeseriesService } from '../providers/timeseries/user-timeseries';
import { UserLocationListProvider } from '../providers/user-location-list/user-location-list';
import { MyApp } from './app.component';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    IntroPage,
    MyApp,
    StartPage
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    HelgolandMapSelectorModule,
    HelgolandMapControlModule,
    HelgolandDatasetlistModule,
    HelgolandMapViewModule,
    HelgolandD3Module,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    IonicModule.forRoot(MyApp, {
      scrollAssist: false
    }),
    IonicStorageModule.forRoot(),
    IonAffixModule,
    ComponentsModule,
    SettingsModule,
    DiagramModule,
    MapModule,
    CacheModule.forRoot({ keyPrefix: 'belair-cache_' })
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    IntroPage,
    MyApp,
    StartPage
  ],
  providers: [
    { provide: DatasetApiInterface, useClass: CustomDatasetApiInterface },
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    { provide: GeoSearch, useClass: GeoSearchService },
    { provide: SettingsService, useClass: JSSONSettingsService },
    {
      provide: APP_INITIALIZER,
      useFactory: languageInitializerFactory,
      deps: [TranslateService, Injector, LanguageHandlerProvider, SettingsService],
      multi: true
    },
    AirQualityIndexProvider,
    AnnualMeanProvider,
    AppVersion,
    BackgroundMode,
    BelaqiIndexProvider,
    CategorizeValueToIndexProvider,
    DatasetOptionsModifier,
    Diagnostic,
    FCM,
    GeoLabelsProvider,
    Geolocation,
    InAppBrowser,
    IrcelineSettingsProvider,
    LanguageHandlerProvider,
    LayerGeneratorService,
    LocalNotifications,
    LocateProvider,
    LocatedTimeseriesService,
    LocationAccuracy,
    ModelledValueProvider,
    NearestTimeseriesManagerProvider,
    NearestTimeseriesProvider,
    Network,
    NotificationMaintainerProvider,
    NotificationPresenter,
    PersonalAlertsProvider,
    PushNotificationsProvider,
    RefreshHandler,
    SplashScreen,
    StatusBar,
    TimeseriesService,
    UserLocationListProvider,
    UserTimeseriesService,
    CustomDatasetApiInterface
  ]
})
export class AppModule { }
