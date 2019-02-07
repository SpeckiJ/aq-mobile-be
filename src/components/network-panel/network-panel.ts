import { Component, OnInit } from '@angular/core';
import { Network } from '@ionic-native/network';
import { TranslateService } from '@ngx-translate/core';
import { Platform } from 'ionic-angular';
import { Subscription } from 'rxjs';

import { IrcelineSettingsProvider } from '../../providers/irceline-settings/irceline-settings';
import { RefreshHandler } from '../../providers/refresh/refresh';

@Component({
  selector: 'network-panel',
  templateUrl: 'network-panel.html'
})
export class NetworkPanelComponent implements OnInit {

  public lastupdate: Date;
  public offline: boolean = false;
  public backOnline: boolean = false;

  private networkSubscriber: Subscription;
  private refreshSubscriber: Subscription;

  constructor(
    private ircelineSettings: IrcelineSettingsProvider,
    private network: Network,
    private platform: Platform,
    private refreshHandler: RefreshHandler,
    protected translate: TranslateService,
  ) { }

  public ngOnInit(): void {
    this.runChecks();
    this.refreshSubscriber = this.refreshHandler.onRefresh.subscribe(() => this.runChecks());
  }

  public ngOnDestroy() {
    if (this.networkSubscriber) { this.networkSubscriber.unsubscribe(); }
    if (this.refreshSubscriber) { this.refreshSubscriber.unsubscribe(); }
  }

  private runChecks() {
    this.ircelineSettings.getSettings(false).subscribe(ircelineSettings => {
      this.lastupdate = ircelineSettings.lastupdate;
    });
    if (this.platform.is('cordova')) {
      if (this.network.type === 'none') {
        this.offline = true;
      }
      this.networkSubscriber = this.network.onchange().subscribe(() => this.updateNetworkStatus());
    }
  }

  private updateNetworkStatus() {
    if (this.network.type) {
      switch (this.network.type) {
        case 'none':
          this.offline = true;
          break;
        default:
          this.backOnline = true;
          setTimeout(() => {
            this.backOnline = false;
          }, 5000);
          this.offline = false;
          break;
      }
    }
  }

}
