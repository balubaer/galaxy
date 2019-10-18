import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Message } from '@galaxy/api-interfaces';
import { World } from '@galaxy/game-objects';

@Component({
  selector: 'galaxy-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  hello$ = this.http.get<Message>('/api/hello');
  worlds$ = this.http.get<World[]>('/api/Worlds');

  constructor(private http: HttpClient) {}

}
