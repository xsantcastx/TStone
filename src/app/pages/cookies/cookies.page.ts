import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cookies-page',
  standalone: true,
  imports: [CommonModule, TranslateModule, RouterLink],
  templateUrl: './cookies.page.html',
  styleUrl: './cookies.page.scss'
})
export class CookiesPageComponent {
  currentDate = new Date();
}
