import { Injectable } from '@angular/core';
import { AppVersion } from '@ionic-native/app-version';
import { Storage } from '@ionic/storage';
import { Platform, PopoverController } from 'ionic-angular';

import { UpdateHintPopoverComponent } from '../../components/update-hint-popover/update-hint-popover';

const STORAGE_LAST_INSTALLED_VERSION_CODE = 'lastInstalledVersionCode';
const STORAGE_DONT_SHOW_ON_STARTUP = 'dontShowPopupOnStartup';

@Injectable({
  providedIn: 'root'
})
export class UpdateCheckProvider {

  constructor(
    private platform: Platform,
    private appVersion: AppVersion,
    private storage: Storage,
    private popoverCtrl: PopoverController
  ) { }

  public init(): any {
    this.checkToShowWindow();
  }

  public setDontShowOnStartup(dontShow: boolean) {
    this.storage.set(STORAGE_DONT_SHOW_ON_STARTUP, dontShow);
  }

  private checkToShowWindow() {
    this.storage.get(STORAGE_DONT_SHOW_ON_STARTUP)
      .then(dontShowOnStartup => {
        if (dontShowOnStartup === null || !dontShowOnStartup) {
          this.presentPopover();
        } else {
          if (this.platform.is('cordova')) {
            // this.storage.remove(STORAGE_LAST_INSTALLED_VERSION_CODE);
            this.storage.get(STORAGE_LAST_INSTALLED_VERSION_CODE)
              .then(lastVC => {
                this.appVersion.getVersionCode()
                  .then(vCode => {
                    console.log(`Last version: ${lastVC}, Current version ${vCode}`);
                    if (!lastVC || lastVC.toString() !== vCode.toString()) {
                      this.presentPopover();
                      this.setDontShowOnStartup(false);
                    }
                    this.storage.set(STORAGE_LAST_INSTALLED_VERSION_CODE, vCode.toString());
                  })
              });
          }
        }
      });
  }

  private presentPopover() {
    this.popoverCtrl.create(UpdateHintPopoverComponent, {}, { showBackdrop: true, cssClass: 'update-hint-popover' }).present();
  }

}
