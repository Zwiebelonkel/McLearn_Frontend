import { Component, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'app-help-page',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './help-page.component.html',
  styleUrl: './help-page.component.scss'
})
export class HelpPageComponent {
  translate = inject(TranslateService);

  switchLanguage(event: any) {
    this.translate.use(event.target.value);
  }
}
