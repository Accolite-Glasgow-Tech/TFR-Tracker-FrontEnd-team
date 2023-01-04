import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, Observable } from 'rxjs';
import { IStatus } from '../Interface/Status.Interface';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private vendorURL = 'http://localhost:4200/vendors';
  //private StatusUrl = 'http://localhost:4200/projects/statusCount';

  constructor(private http: HttpClient) {
    this.getVendorData().subscribe((data) => {});
    //this.getStatusData().subscribe((data) => {});
  }

  getVendorData(): Observable<any> {
    return this.http.get(this.vendorURL);
  }

  // getStatusData(): Observable<any> {
  //   return this.http.get(this.StatusUrl);
  // }

  tfrStatus: IStatus[] = require('../../assets/json/status.json');
  gettfrStatusData(): Observable<IStatus[]> {
    console.log('*********************', this.tfrStatus);
    return of(this.tfrStatus);
  }

  ngOnInit() {}
}
