import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutModule } from './layout/layout.module';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LayoutModule],
  template: '<app-main-layout></app-main-layout>'
})
export class AppComponent {
  title = 'supply-sync-frontend';
} 