import { Injectable } from '@angular/core';
@Injectable({
  providedIn: 'root',
})
export class userService {
  constructor() {}

  isLoggedIn(): boolean {
    return sessionStorage.getItem('jwt_token') !== null;
  }

  getUserID(): Number {
    return Number(sessionStorage.getItem('user_id'));
  }
}
