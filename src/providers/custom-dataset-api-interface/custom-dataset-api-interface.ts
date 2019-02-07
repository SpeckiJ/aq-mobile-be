import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  HttpRequestOptions,
  HttpService,
  InternalIdHandler,
  ParameterFilter,
  SplittedDataDatasetApiInterface,
  Timeseries,
} from '@helgoland/core';
import { TranslateService } from '@ngx-translate/core';
import { CacheService } from 'ionic-cache';
import { Observable, Observer } from 'rxjs';
import { map } from 'rxjs/operators';

import { IrcelineSettingsProvider } from '../irceline-settings/irceline-settings';

@Injectable()
export class CustomDatasetApiInterface extends SplittedDataDatasetApiInterface {

  constructor(
    protected httpservice: HttpService,
    protected internalDatasetId: InternalIdHandler,
    protected translate: TranslateService,
    protected cacheService: CacheService,
    protected ircelineSettings: IrcelineSettingsProvider,
    protected http: HttpClient
  ) {
    super(httpservice, internalDatasetId, translate);
  }

  public getTimeseries(apiUrl: string, params?: ParameterFilter): Observable<Timeseries[]> {
    const url = this.createRequestUrl(apiUrl, 'timeseries');
    return this.requestApi<Timeseries[]>(url, params).pipe(map(
      res => {
        res.forEach(e => {
          e.url = apiUrl;
          this.internalDatasetId.generateInternalId(e);
        });
        return res;
      }
    ));
  }

  protected requestApi<T>(url: string, params: ParameterFilter = {}, options: HttpRequestOptions = {}): Observable<T> {
    options.forceUpdate = true;
    return new Observable((observer: Observer<T>) => {
      this.ircelineSettings.getSettings().subscribe(settings => {
        const request = this.http.get<T>(url, {
          params: this.prepareParams(params),
          headers: this.createBasicAuthHeader(options.basicAuthToken)
        })
        const cacheKey = url + '_' + JSON.stringify(params) + settings.lastupdate.toISOString();
        this.cacheService.loadFromObservable(cacheKey, request).subscribe(
          res => observer.next(res),
          error => observer.error(error),
          () => observer.complete()
        );
      });
    });
  }
}
