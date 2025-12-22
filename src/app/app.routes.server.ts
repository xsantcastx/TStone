import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'productos',
    renderMode: RenderMode.Server
  },
  {
    path: 'productos/:grosor',
    renderMode: RenderMode.Server
  },
  {
    path: 'productos/:grosor/:slug',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
