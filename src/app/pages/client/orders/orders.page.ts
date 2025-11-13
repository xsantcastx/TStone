import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../services/auth.service';

export interface Order {
  id: string;
  orderNumber: string;
  date: Date;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  items: OrderItem[];
  shippingAddress?: string;
  trackingNumber?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image?: string;
}

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './orders.page.html',
  styleUrl: './orders.page.scss'
})
export class OrdersPageComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  orders: Order[] = [];
  isLoading = true;
  errorMessage = '';
  selectedFilter: 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' = 'all';

  async ngOnInit() {
    this.loadOrders();
  }

  private async loadOrders() {
    this.isLoading = true;
    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        this.router.navigate(['/client/login']);
        return;
      }

      // TODO: Implement actual order fetching from Firestore
      // For now, using mock data
      this.orders = this.getMockOrders();
    } catch (error) {
      console.error('Error loading orders:', error);
      this.errorMessage = 'client.errors.load_orders_failed';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  get filteredOrders(): Order[] {
    if (this.selectedFilter === 'all') {
      return this.orders;
    }
    return this.orders.filter(order => order.status === this.selectedFilter);
  }

  setFilter(filter: 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled') {
    this.selectedFilter = filter;
  }

  getStatusClass(status: Order['status']): string {
    const classes: Record<Order['status'], string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      shipped: 'bg-purple-100 text-purple-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return classes[status];
  }

  async logout() {
    try {
      await this.authService.signOutUser();
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Mock data for demonstration
  private getMockOrders(): Order[] {
    return [
      {
        id: '1',
        orderNumber: 'TS-2024-001',
        date: new Date('2024-01-15'),
        status: 'delivered',
        total: 2450.00,
        items: [
          {
            productId: 'p1',
            productName: 'Arctic White 20mm',
            quantity: 10,
            price: 245.00,
            image: '/assets/productos/20mm/arctic-white.jpg'
          }
        ],
        shippingAddress: 'Calle Principal 123, Madrid, Spain',
        trackingNumber: 'TRK123456789'
      },
      {
        id: '2',
        orderNumber: 'TS-2024-002',
        date: new Date('2024-01-20'),
        status: 'shipped',
        total: 1890.00,
        items: [
          {
            productId: 'p2',
            productName: 'Carrara Marble 15mm',
            quantity: 15,
            price: 126.00
          }
        ],
        trackingNumber: 'TRK987654321'
      },
      {
        id: '3',
        orderNumber: 'TS-2024-003',
        date: new Date('2024-01-25'),
        status: 'processing',
        total: 3200.00,
        items: [
          {
            productId: 'p3',
            productName: 'Concrete Grey 12mm',
            quantity: 20,
            price: 160.00
          }
        ]
      },
      {
        id: '4',
        orderNumber: 'TS-2024-004',
        date: new Date('2024-01-28'),
        status: 'pending',
        total: 4500.00,
        items: [
          {
            productId: 'p4',
            productName: 'Black Granite 20mm',
            quantity: 12,
            price: 375.00
          }
        ]
      }
    ];
  }
}
