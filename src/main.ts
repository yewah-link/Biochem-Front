import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, {
  providers: [
    ...appConfig.providers,
    provideHttpClient(), // Add this
  ]
})
.catch((err) => console.error(err));