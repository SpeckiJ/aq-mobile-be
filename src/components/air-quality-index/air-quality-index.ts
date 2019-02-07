import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { LanguageChangNotifier, SettingsService } from '@helgoland/core';
import { GeoSearch } from '@helgoland/map';
import { TranslateService } from '@ngx-translate/core';

import { AirQualityIndex, AirQualityIndexProvider } from '../../providers/air-quality-index/air-quality-index';
import { RefreshHandler } from '../../providers/refresh/refresh';
import { MobileSettings } from '../../providers/settings/settings';
import { Subscription } from 'rxjs';

@Component({
  selector: 'air-quality-index',
  templateUrl: 'air-quality-index.html'
})
export class AirQualityIndexComponent extends LanguageChangNotifier implements OnDestroy {

  @Output()
  public onBoundsUpdated: EventEmitter<L.LatLngBoundsExpression> = new EventEmitter<L.LatLngBoundsExpression>();

  public regions: string[];
  public regionLabel: string;
  public selectedRegion: string;
  public airQualityIndex: AirQualityIndex[];

  private refreshSubscriber: Subscription;

  constructor(
    private settings: SettingsService<MobileSettings>,
    private geoSearch: GeoSearch,
    private aqIndex: AirQualityIndexProvider,
    private refreshHandler: RefreshHandler,
    protected translate: TranslateService
  ) {
    super(translate);
    this.regions = this.settings.getSettings().regions;
    this.selectedRegion = this.regions[0];
    this.onChange(this.selectedRegion);
    this.refreshSubscriber = this.refreshHandler.onRefresh.subscribe(() => this.onChange(this.selectedRegion, true))
  }

  public ngOnDestroy(): void {
    if (this.refreshSubscriber) { this.refreshSubscriber.unsubscribe(); }
  }

  protected languageChanged(): void {
    this.onChange(this.selectedRegion);
  }

  public onChange(region: string, reload: boolean = false) {
    this.selectAqIndex(region, reload);
    this.geoSearch.searchTerm(region, {
      countrycodes: this.settings.getSettings().geoSearchCountryCodes,
      acceptLanguage: this.translate.currentLang
    }).subscribe(res => {
      if (res.bounds) {
        this.onBoundsUpdated.emit(res.bounds)
      }
    });
  }

  private selectAqIndex(region: string, reload: boolean) {
    this.airQualityIndex = [];
    this.aqIndex.getAirQualityIndex(reload).subscribe(res => {
      if (res[region]) {
        this.regionLabel = res[region].label;
        this.airQualityIndex = res[region].index;
      }
    })
  }
}
