import { Component } from '@angular/core';
import { LocalSelectorComponent } from '@helgoland/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController, ToastController } from 'ionic-angular';
import { CacheService } from 'ionic-cache';

@Component({
  selector: 'common-settings',
  templateUrl: 'common-settings.html'
})
export class CommonSettingsComponent extends LocalSelectorComponent {

  constructor(
    public translate: TranslateService,
    public nav: NavController,
    private cacheService: CacheService,
    private toast: ToastController
  ) {
    super(translate)
  }

  public clearCache() {
    this.cacheService.clearAll()
    this.toast.create({ message: this.translate.instant('settings.clear-cache.confirm'), duration: 3000 });
  }
}
