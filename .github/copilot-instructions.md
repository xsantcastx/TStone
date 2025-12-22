# TopStone Web - AI Coding Agent Instructions

## Project Overview
TopStone is an Angular 20 e-commerce website for large-format porcelain surfaces, featuring multilingual support (ES/EN/FR/IT), Firebase backend, SSR/SSG capabilities, and role-based admin/client areas.

## Architecture

### Tech Stack
- **Frontend**: Angular 20 (standalone components, zoneless change detection)
- **Backend**: Firebase (Auth, Firestore, Storage, Analytics)
- **Styling**: TailwindCSS + SCSS (BEM-like conventions)
- **Deployment**: Firebase Hosting with SSR via Express
- **i18n**: @ngx-translate/core with JSON files in `src/assets/i18n/`

### Project Structure
```
src/app/
├── core/              # Core services (DataService, LanguageService, CustomTranslateLoader)
├── features/          # Feature-specific components (productos, galeria, home, contacto, datos-tecnicos)
├── guards/            # Route guards (auth.guard.ts, admin.guard.ts) - use CanActivateFn pattern
├── models/            # TypeScript interfaces (product.ts, catalog.ts, media.ts)
├── pages/             # Page-level components with .page.ts suffix
│   ├── admin/         # Admin panel (dashboard, products, gallery, orders, catalogs, clients)
│   ├── client/        # Client area (login, register, profile, orders)
│   └── [public]/      # Public pages (home, productos, galeria, datos-tecnicos, contacto, cart)
├── services/          # Business logic (auth, product-firestore, gallery, cart, etc.)
└── shared/            # Reusable components (image-lightbox, language-selector, product-card, etc.)
```

## Critical Conventions

### Component Architecture
- **Standalone components only** - no NgModules
- **Zoneless change detection** - use signals or explicit change detection
- **Page components**: Named `*.page.ts` for top-level routes
- **Lazy loading**: All routes use `loadComponent()` in `app.routes.ts`
- **File naming**: `component-name.component.ts`, `service-name.service.ts`, `model-name.ts`

### Firebase Integration
- **Services pattern**: Inject Firebase services via `inject()` (e.g., `inject(Firestore)`)
- **Reactive streams**: Return Observables from services, use RxJS operators (not imperative `.subscribe()` in components when possible)
- **Security rules**: Defined in `firestore.rules` - admin role checked via `/users/{uid}.role == 'admin'`
- **Environment config**: Firebase config in `src/environments/environment.ts` (never commit production keys)

### Data Models & Types
- **Product**: Located in `src/app/models/product.ts`
  - Supports multi-language fields via `TranslatedTextMap` (e.g., `descriptionTranslations`, `seoTitleTranslations`)
  - Thickness: `'12mm' | '15mm' | '20mm'` (strict literal types)
  - Status: `'draft' | 'published' | 'archived'`
  - Pricing tiers: `priceStandard`, `pricePremium`, `priceVIP`, `customPrices`
  - Media references: `coverImage` (media ID or URL), `galleryImageIds[]`
  
- **UserProfile**: Located in `src/app/services/auth.service.ts`
  - Role: `'client' | 'admin'`
  - Price tier: `'standard' | 'premium' | 'vip' | 'custom'`

### Multilingual Support
- **Translation files**: `src/assets/i18n/{es,en,fr,it}.json`
- **Service**: `LanguageService` manages current language, persists to localStorage (browser-safe via `isPlatformBrowser`)
- **Usage in components**: Inject `TranslateService` or `LanguageService`, use `| translate` pipe in templates
- **Custom loader**: `CustomTranslateLoader` in `src/app/core/services/translate-loader.ts` handles SSR-safe loading

### Route Guards
- **authGuard**: Checks if user is authenticated via Firebase Auth (`auth.currentUser`)
- **adminGuard**: Checks both authentication AND admin role from Firestore user document
- **Pattern**: Functional guards using `CanActivateFn` (not class-based)
- **Redirects**: Unauthenticated → `/client/login`, non-admin → `/` (home)

## Common Workflows

### Development
```bash
npm start              # Dev server at http://localhost:4200
npm run watch          # Auto-rebuild on file changes
npm run build          # Production build (SSR enabled)
npm run serve:ssr:tstone-web  # Test SSR build locally
```

### Firebase Deployment
```bash
npm run deploy         # Builds and deploys to Firebase Hosting
# Deploys firestore rules: firebase deploy --only firestore:rules
# Deploys storage rules: firebase deploy --only storage
```

### Adding New Services
1. Create in `src/app/services/` with `@Injectable({ providedIn: 'root' })`
2. Inject Firebase dependencies via `inject()` (not constructor)
3. Return Observables for async operations (use `from()` for Promises)
4. Add to specific service groups (auth-related, product-related, admin-related)

### Adding Translations
1. Add key to all 4 language files: `src/assets/i18n/{es,en,fr,it}.json`
2. Use dot notation for nesting: `"admin.products.title": "Productos"`
3. In templates: `{{ 'admin.products.title' | translate }}`
4. In components: `this.translate.instant('admin.products.title')`

### Creating Admin Features
1. Add route in `app.routes.ts` with `canActivate: [adminGuard]`
2. Use `AdminSidebarComponent` for consistent layout
3. Follow existing admin page patterns (see `src/app/pages/admin/dashboard/`)
4. Firestore writes require admin role (enforced via security rules)

## Key Integration Points

### Cart System
- **Service**: `CartService` (signal-based state)
- **Persistence**: localStorage (`ts_cart` key, browser-safe)
- **Components**: `CartButtonComponent` (navbar), `CartPage` (full cart view)
- **Flow**: Add → localStorage → signal update → UI reflects change

### Gallery Upload
- **Service**: `GalleryService` handles Firestore + Storage
- **Component**: `GalleryUploaderComponent` (admin-only)
- **Storage path**: `gallery/{categoryId}/{timestamp}_{filename}`
- **Categories**: cocinas, baños, fachadas, industria, otros
- **Upload flow**: Select files → compress (if >1MB) → upload to Storage → save metadata to Firestore `galleryImages` collection

### Product Management
- **Service**: `ProductFirestoreService` (CRUD operations)
- **Admin UI**: `src/app/pages/admin/products/products-admin.page.ts`
- **Public UI**: `src/app/pages/productos/productos.page.ts`
- **Thickness filtering**: Products grouped by `grosor` field (`12mm`, `15mm`, `20mm`)
- **Route structure**: `/productos` → `/productos/{grosor}` → `/productos/{grosor}/{slug}`

### Email Integration
- **Service**: `EmailService` (uses Brevo API)
- **Contact form**: `src/app/pages/contacto/contacto.page.ts`
- **Order confirmations**: Triggered from cart submission
- **Config**: API key in environment files (use environment variables in production)

## Styling Guidelines
- **Primary colors**: `--ts-ink` (#0B0B0C), `--ts-bone` (#F3F2EF), `--ts-bronze` (#B08968)
- **Utility-first**: Prefer Tailwind classes over custom SCSS
- **Component styles**: SCSS files use BEM-like naming (`.product-card__title`)
- **Responsive**: Mobile-first approach, use Tailwind breakpoints (`md:`, `lg:`)

## Testing & Debugging

### Testing Approach
- **Framework**: Karma + Jasmine configured in `tsconfig.spec.json`
- **Test coverage**: Business logic tests implemented for cart, auth, pricing, and language services with 65/72 tests passing (90% pass rate)
- **Command**: `npm test` (runs Karma test runner)
- **Watch mode**: `npm test -- --watch` for development
- **Run specific tests**: `npm test -- --include='**/service-name.spec.ts' --watch=false`

### Implemented Tests (Service Layer - 65/72 passing)
- ✅ **CartService** (`src/app/services/cart.service.spec.ts`) - 17 tests
  - Add/remove/update product operations
  - Quantity validation (min 1)
  - localStorage persistence and corruption handling
  - Observable signals (`cart$`, `count$`)
  - State snapshot access
  
- ✅ **AuthService** (`src/app/services/auth.service.spec.ts`) - 16 tests
  - User registration with Firestore profile creation
  - Login/logout flows  
  - Profile retrieval and updates
  - Admin vs client role checks
  - Price tier management (standard, premium, VIP, custom)
  
- ✅ **PricingService** (`src/app/services/pricing.service.spec.ts`) - 16 tests
  - Tier-based pricing calculations
  - Custom discount percentages
  - User-specific custom prices  
  - Fallback behavior
  - Non-mutating array operations

- ✅ **LanguageService** (`src/app/core/services/language.service.spec.ts`) - 23 tests
  - Language switching (ES/EN/FR/IT)
  - localStorage persistence
  - Browser language detection
  - TranslateService integration
  - Observable language stream

### Implemented Tests (Component Layer)
- ✅ **ProductCardComponent** (`src/app/shared/components/product-card/product-card.component.spec.ts`)
  - Cart integration with timing tests
  - Routing logic with grosor paths
  - Template rendering verification
  - User interaction handling
  
- ✅ **LanguageSelectorComponent** (`src/app/shared/components/language-selector/language-selector.component.spec.ts`)
  - Dropdown toggle behavior
  - Language selection
  - TranslateModule integration  
  - Accessibility (ARIA attributes)

### Test Patterns for Standalone Components
```typescript
// Component test with zoneless change detection
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [YourComponent],  // Import standalone component directly
    providers: [provideZonelessChangeDetection()]
  }).compileComponents();
});
```

### Test Patterns for Services
```typescript
// Service test (services use providedIn: 'root')
import { TestBed } from '@angular/core/testing';

beforeEach(() => {
  TestBed.configureTestingModule({});
  service = TestBed.inject(YourService);
});
```

### Testing Components with Dependencies
```typescript
// Components with router
import { provideRouter } from '@angular/router';

beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [YourComponent],
    providers: [provideRouter([])]  // Empty routes for testing
  }).compileComponents();
});

// Components with translations
import { TranslateModule } from '@ngx-translate/core';

beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [YourComponent, TranslateModule.forRoot()]
  }).compileComponents();
});

// Components with Firebase (mock it)
import { Firestore } from '@angular/fire/firestore';

const firestoreMock = {
  collection: jasmine.createSpy('collection'),
  doc: jasmine.createSpy('doc')
};

beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [YourComponent],
    providers: [
      { provide: Firestore, useValue: firestoreMock }
    ]
  }).compileComponents();
});
```

### Testing Guidelines
- **Focus**: Write tests for critical business logic (cart, auth, pricing calculations)
- **Avoid**: Over-testing presentation logic or auto-generated components
- **Firebase**: Mock Firebase services in tests (don't hit real database)
- **Signals**: Test signal updates and computed values
- **Async**: Use `fakeAsync()` and `tick()` for testing Observable/Promise flows

### Debugging
- **Errors**: Check `get_errors` tool output for TypeScript/lint issues
- **SSR issues**: Ensure browser-only code wrapped in `isPlatformBrowser(platformId)` check
- **Firebase emulators**: Not configured (uses production Firebase in dev)
- **Console logging**: Remove before committing production code

## Documentation References
- Full implementation status: `IMPLEMENTATION_STATUS.md`
- Admin features: `ADMIN_PANEL_COMPLETE.md`
- Client area: `CLIENT_AREA_COMPLETE.md`
- Catalog system: `CATALOG_SYSTEM.md`
- Session progress: `PROGRESS_SESSION_*.md`
