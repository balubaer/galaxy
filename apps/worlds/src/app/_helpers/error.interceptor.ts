import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthenticationService } from '../_services/authentication.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
    constructor(private authenticationService: AuthenticationService) {

    }
    
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(catchError(err => {


            if (err instanceof HttpErrorResponse) {
                if ((err.url.endsWith('/users/authenticate')) && err.status === 401) {
                    this.authenticationService.logout();
                    location.reload(true);
                }
            } else {
                // The backend returned an unsuccessful response code.
                // The response body may contain clues as to what went wrong,
                console.error(`Backend returned code ${err.status}, body was: ${err.error}`);
            }

            // ...optionally return a default fallback value so app can continue (pick one)
            // which could be a default value (which has to be a HttpResponse here)
            // return Observable.of(new HttpResponse({body: [{name: "Default value..."}]}));
            // or simply an empty observable
            const error = err.error.message || err.statusText;

            return throwError(error);
        }
        ));
    }
}
