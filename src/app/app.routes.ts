import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.page').then(m => m.HomePageComponent),
    title: 'TopStone | Superficies Porcelánicas de Gran Formato'
  },
  {
    path: 'productos',
    loadComponent: () => import('./pages/productos/productos.page').then(m => m.ProductosPageComponent),
    title: 'TopStone | Productos'
  },
  {
    path: 'productos/:grosor',
    loadComponent: () => import('./pages/productos/grosor/grosor.component').then(m => m.GrosorComponent),
    title: 'TopStone | Productos por Grosor'
  },
  {
    path: 'productos/:grosor/:slug',
    loadComponent: () => import('./pages/productos/detalle/detalle.component').then(m => m.DetalleComponent),
    title: 'TopStone | Detalle de Producto'
  },
  {
    path: 'galeria',
    loadComponent: () => import('./pages/galeria/galeria.page').then(m => m.GaleriaPageComponent),
    title: 'TopStone | Galería de Proyectos'
  },
  {
    path: 'datos-tecnicos',
    loadComponent: () => import('./pages/datos-tecnicos/datos-tecnicos.page').then(m => m.DatosTecnicosPageComponent),
    title: 'TopStone | Datos Técnicos'
  },
  {
    path: 'contacto',
    loadComponent: () => import('./pages/contacto/contacto.page').then(m => m.ContactoPageComponent),
    title: 'TopStone | Contacto'
  },
  {
    path: 'cart',
    loadComponent: () => import('./pages/cart/cart.page').then(m => m.CartPage),
    title: 'TopStone | Carrito'
  },
  // Client Area Routes
  {
    path: 'client/login',
    loadComponent: () => import('./pages/client/login/login.page').then(m => m.LoginPageComponent),
    title: 'TopStone | Iniciar Sesión'
  },
  {
    path: 'client/register',
    loadComponent: () => import('./pages/client/register/register.page').then(m => m.RegisterPageComponent),
    title: 'TopStone | Registro'
  },
  {
    path: 'client/profile',
    loadComponent: () => import('./pages/client/profile/profile.page').then(m => m.ProfilePageComponent),
    canActivate: [authGuard],
    title: 'TopStone | Mi Perfil'
  },
  {
    path: 'client/orders',
    loadComponent: () => import('./pages/client/orders/orders.page').then(m => m.OrdersPageComponent),
    canActivate: [authGuard],
    title: 'TopStone | Mis Pedidos'
  },
  // Admin Panel Routes
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/dashboard/dashboard.page').then(m => m.AdminDashboardComponent),
    canActivate: [adminGuard],
    title: 'TopStone | Panel de Administración'
  },
  {
    path: 'admin/products',
    loadComponent: () => import('./pages/admin/products/products-admin.page').then(m => m.ProductsAdminComponent),
    canActivate: [adminGuard],
    title: 'TopStone | Gestión de Productos'
  },
  {
    path: 'admin/products/quick-add',
    loadComponent: () => import('./pages/admin/products/quick-add-product.page').then(m => m.QuickAddProductComponent),
    canActivate: [adminGuard],
    title: 'TopStone | Quick Add Product'
  },
  {
    path: 'admin/gallery',
    loadComponent: () => import('./pages/admin/gallery/gallery-admin.page').then(m => m.GalleryAdminComponent),
    canActivate: [adminGuard],
    title: 'TopStone | Gestión de Galería'
  },
  {
    path: 'admin/catalog',
    loadComponent: () => import('./pages/admin/catalog/catalog-admin.page').then(m => m.CatalogAdminComponent),
    canActivate: [adminGuard],
    title: 'TopStone | Catálogo Master'
  },
  {
    path: 'admin/datos-tecnicos',
    loadComponent: () => import('./pages/admin/datos-tecnicos/datos-tecnicos-admin.page').then(m => m.DatosTecnicosAdminComponent),
    canActivate: [adminGuard],
    title: 'TopStone | Gestión de Datos Técnicos'
  },
  {
    path: 'admin/orders',
    loadComponent: () => import('./pages/admin/orders/orders-admin.page').then(m => m.OrdersAdminComponent),
    canActivate: [adminGuard],
    title: 'TopStone | Gestión de Pedidos'
  },
  {
    path: 'admin/settings',
    loadComponent: () => import('./pages/admin/settings/settings-admin.page').then(m => m.SettingsAdminComponent),
    canActivate: [adminGuard],
    title: 'TopStone | Configuración'
  },
  {
    path: 'admin/users',
    loadComponent: () => import('./pages/admin/users/users-admin.page').then(m => m.UsersAdminComponent),
    canActivate: [adminGuard],
    title: 'TopStone | Gestión de Usuarios'
  },
  {
    path: 'admin/seed',
    loadComponent: () => import('./pages/admin/seed/seed-admin.page').then(m => m.SeedAdminComponent),
    canActivate: [adminGuard],
    title: 'TopStone | Database Seeder'
  },
  // Maintenance Page
  {
    path: 'maintenance',
    loadComponent: () => import('./pages/maintenance/maintenance.page').then(m => m.MaintenancePage),
    title: 'TopStone | Mantenimiento'
  },
  {
    path: '404',
    loadComponent: () => import('./pages/not-found/not-found.page').then(m => m.NotFoundPageComponent),
    title: 'TopStone | Página no encontrada'
  },
  {
    path: '**',
    redirectTo: '404'
  }
];
