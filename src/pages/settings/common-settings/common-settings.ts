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

  public clearingCache: boolean;

  constructor(
    public translate: TranslateService,
    public nav: NavController,
    private cacheService: CacheService,
    private toast: ToastController
  ) {
    super(translate)
  }

  public clearCache() {
    this.clearingCache = true;
    this.cacheService.clearAll()
      .then(() => {
        this.toast.create({ message: this.translate.instant('settings.clear-cache.confirm'), duration: 3000 }).present();
        this.clearingCache = false;
      })
      .catch(error => {
        this.toast.create({ message: JSON.stringify(error), duration: 3000 }).present();
        this.clearingCache = false;
      })
  }
}
