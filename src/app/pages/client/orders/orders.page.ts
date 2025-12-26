import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../services/auth.service';
import { OrderService, Order } from '../../../services/order.service';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './orders.page.html',
  styleUrl: './orders.page.scss'
})
export class OrdersPageComponent implements OnInit {
  private authService = inject(AuthService);
  private orderService = inject(OrderService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  orders: Order[] = [];
  isLoading = true;
  errorMessage = '';
  selectedFilter: 'all' | 'pending' | 'in-progress' | 'completed' | 'cancelled' = 'all';

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

      // Subscribe to user orders from Firestore
      this.orderService.getUserOrders(user.uid).subscribe({
        next: (orders) => {
          this.orders = orders;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading orders:', error);
          this.errorMessage = 'client.errors.load_orders_failed';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    } catch (error) {
      console.error('Error loading orders:', error);
      this.errorMessage = 'client.errors.load_orders_failed';
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

  setFilter(filter: 'all' | 'pending' | 'in-progress' | 'completed' | 'cancelled') {
    this.selectedFilter = filter;
  }

  getStatusClass(status: Order['status']): string {
    const classes: Record<Order['status'], string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      'in-progress': 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
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
}
