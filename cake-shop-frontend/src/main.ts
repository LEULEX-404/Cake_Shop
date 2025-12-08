import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app/app.routes';
import { provideRouter } from '@angular/router';

bootstrapApplication(App, {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []),
    provideHttpClient(withFetch()),// << enable fetch API
    provideRouter(routes)  
  ]
})
  .catch((err) => console.error(err));
