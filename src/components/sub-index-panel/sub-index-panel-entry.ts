import { AfterViewInit, Component, EventEmitter, Input, Output } from '@angular/core';
import invert from 'invert-color';

import { getMainPhenomenonForID } from '../../model/phenomenon';
import { BelaqiIndexProvider } from '../../providers/belaqi/belaqi';
import { CategorizeValueToIndexProvider } from '../../providers/categorize-value-to-index/categorize-value-to-index';
import { IrcelineSettingsProvider } from '../../providers/irceline-settings/irceline-settings';
import { ModelledValueProvider } from '../../providers/modelled-value/modelled-value';
import { UserLocation } from '../../providers/user-location-list/user-location-list';
import { StartPageSettingsProvider } from '../../providers/start-page-settings/start-page-settings';
import { SubIndexEntry } from './sub-index-panel';

@Component({
  selector: '[sub-index-panel-entry]',
  templateUrl: 'sub-index-panel-entry.html'
})
export class SubIndexPanelEntryComponent implements AfterViewInit {

  public color: string;
  public backgroundColor: string;

  public loading: boolean = true;

  @Input()
  public entry: SubIndexEntry;

  @Input()
  public location: UserLocation;

  @Output()
  public onSelect: EventEmitter<string> = new EventEmitter();

  constructor(
    protected ircelineSettings: IrcelineSettingsProvider,
    protected modelledValue: ModelledValueProvider,
    protected categorizeValue: CategorizeValueToIndexProvider,
    protected belaqi: BelaqiIndexProvider,
  ) { }

  public ngAfterViewInit(): void {
    const phenomenon = getMainPhenomenonForID(this.entry.id);
    this.ircelineSettings.getSettings(false).subscribe(setts => {
      this.modelledValue.getValue(this.location.latitude, this.location.longitude, setts.lastupdate, phenomenon).subscribe(
        val => {
          const index = this.categorizeValue.categorize(val, phenomenon)
          this.backgroundColor = this.belaqi.getColorForIndex(index);
          this.color = invert(this.backgroundColor, true);
          this.loading = false;
        },
        () => { this.loading = false }
      )
    })
  }

  public select() {
    this.onSelect.emit(this.entry.id);
  }

}
