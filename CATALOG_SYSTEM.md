# Catalog PDF Management System

## Overview
A complete PDF catalog management system that allows administrators to upload, manage, and version product catalogs. Users can download the latest catalog from multiple locations on the website.

## Architecture

### Backend (Firestore)
- **Collection**: `catalogs`
- **Structure**:
  ```typescript
  interface Catalog {
    id?: string;
    name: string;
    description?: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    uploadedAt: Date;
    uploadedBy?: string;
    version?: string;
    isLatest: boolean;  // Only one catalog should be marked as latest
  }
  ```

### Storage
- PDFs stored in Firebase Storage under `catalogs/` path
- Naming convention: `catalog-{timestamp}-{originalFilename}.pdf`

## Admin Features

### Upload New Catalog
1. Navigate to `/admin/catalogs`
2. Select PDF file (accepts .pdf only)
3. Fill in:
   - **Name** (required): Display name for the catalog
   - **Version** (optional): e.g., "2025 Q1", "v2.0", "Enero 2025"
   - **Description** (optional): Brief description
4. Click "Subir Catálogo"
5. System automatically marks new catalog as "latest" and demotes previous catalogs

### Manage Existing Catalogs
- View all catalogs ordered by upload date (newest first)
- Each catalog shows:
  - Name and version badge
  - Description (if provided)
  - Upload date and time
  - File name and size
  - "Latest" badge for current catalog
- Actions:
  - **Descargar**: Download the PDF
  - **Marcar como Reciente**: Set as the latest catalog (removes latest flag from others)
  - **Eliminar**: Delete catalog from Firestore and Storage

## Public-Facing Display

### Download Button Variants

#### Primary (Full Card)
- Used on: Productos page
- Features:
  - Large PDF icon with red background
  - Catalog name: "Catálogo de Productos"
  - Optional description
  - Version and file size display
  - Prominent blue download button

#### Secondary (Compact Card)
- Used on: Datos Técnicos page
- Features:
  - Smaller PDF icon
  - Catalog info in horizontal layout
  - Compact download button
  - Border hover effect

#### Minimal (Button Only)
- Used in: Footer
- Features:
  - Simple button with PDF icon
  - File size in parentheses
  - Minimal styling

### Page Locations

1. **Productos Page** (`/productos`)
   - Primary variant
   - Positioned after hero section, before filters
   - Most prominent placement for product information

2. **Datos Técnicos Page** (`/datos-tecnicos`)
   - Secondary variant
   - Positioned after header, before technical content
   - Complements technical documentation

3. **Footer** (All pages)
   - Minimal variant
   - Under "Recursos" section
   - Always accessible site-wide

## Service: CatalogService

### Key Methods

```typescript
// Load all catalogs from Firestore
async loadCatalogs(): Promise<void>

// Upload new catalog and mark as latest
async uploadCatalog(
  file: File, 
  name: string, 
  description?: string,
  version?: string,
  uploadedBy?: string
): Promise<void>

// Delete catalog from Firestore and Storage
async deleteCatalog(catalogId: string, fileUrl: string): Promise<void>

// Mark specific catalog as latest
async setLatestCatalog(catalogId: string): Promise<void>
```

### Observables

```typescript
catalogs$: Observable<Catalog[]>        // All catalogs (newest first)
latestCatalog$: Observable<Catalog>     // Currently active catalog
```

## Component: CatalogDownloadComponent

### Inputs
- `variant`: 'primary' | 'secondary' | 'minimal' (default: 'primary')
- `showDescription`: boolean (default: true)

### Usage Examples

```html
<!-- Primary variant on productos page -->
<app-catalog-download variant="primary" [showDescription]="true"></app-catalog-download>

<!-- Secondary variant on datos-tecnicos page -->
<app-catalog-download variant="secondary" [showDescription]="true"></app-catalog-download>

<!-- Minimal variant in footer -->
<app-catalog-download variant="minimal" [showDescription]="false"></app-catalog-download>
```

## User Experience Flow

### For Administrators
1. Go to Admin Dashboard → "Catálogos PDF"
2. Upload new catalog with metadata
3. System automatically marks it as latest
4. Previous catalogs remain accessible but not promoted
5. Can manually set any catalog as latest if needed
6. Can delete outdated catalogs

### For Visitors
1. Visit Productos, Datos Técnicos, or scroll to footer
2. See prominent download button with latest catalog
3. Click to download PDF (opens in new tab)
4. No account required

## Version Management

### Auto-Promotion
- When uploading a new catalog, it's automatically marked as `isLatest: true`
- All other catalogs are updated to `isLatest: false`
- Uses Firestore batch writes for atomic updates

### Manual Override
- Admin can mark any previous catalog as latest
- Useful for rolling back to previous version
- Batch update ensures only one catalog is marked latest

### Historical Tracking
- All catalogs retained unless manually deleted
- Ordered by upload date for easy chronological viewing
- Version field helps identify catalog iterations

## Best Practices

### For Admins
- Use clear version naming (e.g., "2025 Q1", "Enero 2025")
- Add descriptions to explain what's new in each version
- Review and delete very old catalogs periodically
- Keep file sizes reasonable (under 20MB recommended)

### File Requirements
- **Format**: PDF only
- **Recommended Size**: 5-20 MB
- **Optimization**: Compress images before creating PDF
- **Naming**: Use descriptive names (auto-prefixed with timestamp)

## Technical Notes

### Firestore Indexes
No special indexes required - uses simple collection query with orderBy('uploadedAt', 'desc')

### Security Rules
Recommended Firestore rules:
```javascript
match /catalogs/{catalogId} {
  allow read: if true;  // Public read access
  allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

### Storage Rules
Recommended Storage rules:
```javascript
match /catalogs/{allPaths=**} {
  allow read: if true;  // Public download access
  allow write: if request.auth != null && request.auth.token.role == 'admin';
}
```

## Troubleshooting

### Catalog not showing on public pages
- Check that at least one catalog is marked `isLatest: true`
- Verify CatalogService is loaded (it auto-initializes on app start)
- Check browser console for errors

### Upload fails
- Verify file is PDF format
- Check Firebase Storage rules allow admin uploads
- Ensure file size is under Firebase limits (default 10MB for free tier)

### Delete fails
- Catalog removed from Firestore but file remains in Storage
- This is expected behavior (fail-safe)
- Can manually delete from Firebase Console if needed

## Future Enhancements

Potential improvements:
- Multi-language catalogs (one per language)
- Analytics tracking (download count, popular catalogs)
- Email notification when new catalog is uploaded
- Scheduled automatic uploads
- Preview thumbnail generation
- Bulk upload for multiple versions
