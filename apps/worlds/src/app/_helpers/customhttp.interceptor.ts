import { Injectable } from '@angular/core';
import { HttpInterceptor } from '@angular/common/http';
import { HttpRequest } from '@angular/common/http';
import { HttpHandler } from '@angular/common/http';
import { HttpEvent } from '@angular/common/http';
import { AuthenticationService } from '../_services/authentication.service';
import { Observable } from 'rxjs';

@Injectable()
export class CustomHttpInterceptor implements HttpInterceptor {
    constructor(private authenticationService: AuthenticationService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // add authorization header with jwt token if available
        const token = this.authenticationService.getAccessToken();
        if (token.length > 0) {
            request = request.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`
                }
            });
        }
        return next.handle(request);
    }
}
 /* intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  return Observable.fromPromise(this.handleAccess(request, next));
}

private async handleAccess(request: HttpRequest<any>, next: HttpHandler):
    Promise<HttpEvent<any>> {
  const token = await this.authenticationService.getAccessToken();
  let changedRequest = request;
  // HttpHeader object immutable - copy values
  const headerSettings: {[name: string]: string | string[]; } = {};

  for (const key of request.headers.keys()) {
    headerSettings[key] = request.headers.getAll(key);
  }
  if (token) {
    headerSettings['Authorization'] = 'Bearer ' + token;
  }
  headerSettings['Content-Type'] = 'application/json';
  const newHeader = new HttpHeaders(headerSettings);

  changedRequest = request.clone({
    headers: newHeader});
  return next.handle(changedRequest).toPromise();
}

}*/

/*js
getToken(): Promise{
return new Promise((resolve, reject)=>{
this.commonService.getToken().subscribe(token=>{
this.localDate = new Date();
localStorage.setItem('token', JSON.stringify(token));
resolve(token);
})
})
}*/