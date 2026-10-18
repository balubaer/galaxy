import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AlertService } from '../_services/alert.service';


@Component({
    selector: 'galaxy-alert', templateUrl: 'alert.component.html',
    standalone: false
})
export class AlertComponent implements OnInit, OnDestroy {
    private subscription: Subscription | null;
    message: any;

    constructor(private alertService: AlertService) { 
        this.subscription = null;
    }
    ngOnInit() {
        this.subscription = this.alertService.getAlert()
            .subscribe(message => {
                switch (message && message.type) {
                    case 'success':
                        message.cssClass = 'alert alert-success';
                        break;
                    case 'error':
                        message.cssClass = 'alert alert-danger';
                        break;
                }

                this.message = message;
            });
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}