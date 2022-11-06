import { Component, OnInit } from '@angular/core';
import { environment } from '../environments/environment.prod';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormControl } from '@angular/forms';
import * as mapboxgl from 'mapbox-gl';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  cities: any[] = [];
  search = new FormControl();
  hideTrip = true;
  title = 'TravellerUI';
  tripRoute: any = {};

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.searchCity('')
    this.search.valueChanges.pipe().subscribe(cityName => {
      this.searchCity(cityName)
    })
  }

  searchCity(queryString: string) {
    if (queryString) {
      this.http
        .get(environment.travellerAPI + '/Cities?cityName=' + queryString)
        .subscribe(response => {
          this.cities = <Array<any>>response;
        });
    } else {
      this.cities = [];
    }
  }

  onSearchClicked() {
    this.searchCity(this.search.value);
    if (this.search.value != "" && this.cities.length != 0) {
      this.http
        .get(environment.travellerAPI + '/Trip?fromCity=' + this.search.value)
        .pipe(
          catchError(this.handleError)
        )
        .subscribe(response => {
          this.hideTrip = false;
          this.tripRoute = response;
          this.populateMap();
        });
    } else {
      this.hideTrip = true;
    }
  }

  populateMap() {
    const map = new mapboxgl.Map({
      accessToken: environment.mapboxAccessToken,
      container: 'map',
      style: 'mapbox://styles/mapbox/light-v10',
      zoom: 1.25
    });

    for (const city of this.tripRoute.cities) {
      const el = document.createElement('div');
      el.className = 'marker';

      new mapboxgl.Marker(el)
        .setLngLat([city.location.lon, city.location.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(
              `<h3>${city.name}</h3><p>${city.countryName}</p>`
            )
        )
        .addTo(map);
    }
  }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 0) {
      console.error('An error occurred:', error.error);
    } else {
      console.error(
        `Backend returned code ${error.status}, body was: `, error.error);
    }
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }
}
