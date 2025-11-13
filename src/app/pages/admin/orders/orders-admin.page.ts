import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../services/auth.service';
import { AdminSidebarComponent } from '../../../shared/components/admin-sidebar/admin-sidebar.component';
import { Firestore, collection, query, orderBy, onSnapshot, doc, updateDoc, Timestamp } from '@angular/fire/firestore';

interface OrderItem {
  productId: string;
  name: string;
  qty?: number;
  quantity?: number;
  unitPrice?: number;
  price?: number;
  thickness?: string;
  grosor?: string;
  sku?: string;
  image?: string;
  imageUrl?: string;
}

interface ShippingAddress {
  firstName?: string;
  lastName?: string;
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phoneE164?: string;
  email?: string;
  // Legacy fields
  street?: string;
  phone?: string;
}

interface Order {
  id?: string;
  orderNumber: string;
  createdAt?: any;
  date?: Date;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  subtotal?: number;
  shipping?: number;
  tax?: number;
  discount?: number;
  currency?: string;
  items: OrderItem[];
  itemCount?: number;
  userId?: string;
  // Legacy cart checkout fields
  customerName?: string;
  customerEmail?: string;
  customer?: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress?: ShippingAddress;
  shippingMethod?: string;
  trackingNumber?: string;
  tracking?: string;
  notes?: string;
  paymentIntentId?: string;
}

@Component({
  selector: 'app-orders-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, AdminSidebarComponent],
  templateUrl: './orders-admin.page.html',
  styleUrl: './orders-admin.page.scss'
})
export class OrdersAdminComponent implements OnInit {
  private firestore: Firestore;
  
  orders = signal<Order[]>([]);
  selectedStatus: 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' = 'all';
  searchQuery = '';
  isLoading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  // Detail modal
  showDetailModal = false;
  selectedOrder: Order | null = null;

  // Status update
  showStatusModal = false;
  orderToUpdate: Order | null = null;
  newStatus: Order['status'] = 'pending';
  
  // Track number update
  trackingNumber = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    firestore: Firestore
  ) {
    this.firestore = firestore;
  }

  ngOnInit(): void {
    // Check if user is admin
    this.authService.userProfile$.subscribe(profile => {
      if (!profile || profile.role !== 'admin') {
        console.log('Access denied: User is not admin');
        this.router.navigate(['/']);
      }
    });

    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading.set(true);
    
    // Query all orders from Firestore
    const ordersRef = collection(this.firestore, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    
    onSnapshot(q, (snapshot) => {
      const orders: Order[] = [];
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        orders.push({
          id: doc.id,
          orderNumber: data['orderNumber'] || `ORD-${doc.id.slice(-8).toUpperCase()}`,
          date: data['createdAt'] instanceof Timestamp 
            ? data['createdAt'].toDate() 
            : new Date(data['createdAt']),
          createdAt: data['createdAt'],
          status: data['status'] || 'pending',
          total: data['total'] || 0,
          subtotal: data['subtotal'],
          shipping: data['shipping'],
          tax: data['tax'],
          discount: data['discount'],
          currency: data['currency'] || 'EUR',
          items: data['items'] || [],
          itemCount: data['itemCount'],
          userId: data['userId'],
          // Cart order fields
          customerName: data['customerName'],
          customerEmail: data['customerEmail'],
          // Regular order fields
          customer: data['customer'],
          shippingAddress: data['shippingAddress'],
          shippingMethod: data['shippingMethod'],
          trackingNumber: data['trackingNumber'],
          tracking: data['tracking'],
          notes: data['notes'],
          paymentIntentId: data['paymentIntentId'],
        });
      });
      
      this.orders.set(orders);
      this.isLoading.set(false);
    }, (error) => {
      console.error('Error loading orders:', error);
      this.errorMessage.set('Error al cargar pedidos');
      this.isLoading.set(false);
    });
  }

  get filteredOrders(): Order[] {
    let filtered = [...this.orders()];

    // Filter by status
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(order => order.status === this.selectedStatus);
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(order => {
        const orderNum = order.orderNumber?.toLowerCase() || '';
        const customerName = order.customer?.name?.toLowerCase() || '';
        const customerEmail = order.customer?.email?.toLowerCase() || '';
        const cartCustomerName = order.customerName?.toLowerCase() || '';
        const cartCustomerEmail = order.customerEmail?.toLowerCase() || '';
        const shippingName = order.shippingAddress?.firstName && order.shippingAddress?.lastName
          ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`.toLowerCase()
          : '';
        
        return orderNum.includes(query) ||
               customerName.includes(query) ||
               customerEmail.includes(query) ||
               cartCustomerName.includes(query) ||
               cartCustomerEmail.includes(query) ||
               shippingName.includes(query);
      });
    }

    return filtered;
  }

  getStatusCount(status: string): number {
    if (status === 'all') {
      return this.orders().length;
    }
    return this.orders().filter(order => order.status === status).length;
  }

  getStatusClass(status: Order['status']): string {
    const classes: Record<Order['status'], string> = {
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      processing: 'bg-blue-100 text-blue-800 border border-blue-200',
      shipped: 'bg-purple-100 text-purple-800 border border-purple-200',
      delivered: 'bg-green-100 text-green-800 border border-green-200',
      cancelled: 'bg-red-100 text-red-800 border border-red-200'
    };
    return classes[status];
  }

  getCustomerName(order: Order): string {
    // Check for cart order fields first
    if (order.customerName) {
      return order.customerName;
    }
    
    if (order.customer?.name) {
      return order.customer.name;
    }
    
    const firstName = order.shippingAddress?.firstName || '';
    const lastName = order.shippingAddress?.lastName || '';
    
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    
    return 'N/A';
  }

  getCustomerEmail(order: Order): string {
    // Check for cart order fields first
    if (order.customerEmail) {
      return order.customerEmail;
    }
    
    return order.customer?.email || order.shippingAddress?.email || 'N/A';
  }

  openDetailModal(order: Order): void {
    this.selectedOrder = order;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedOrder = null;
  }

  openStatusModal(order: Order): void {
    this.orderToUpdate = order;
    this.newStatus = order.status;
    this.showStatusModal = true;
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.orderToUpdate = null;
  }

  async updateStatus(): Promise<void> {
    if (!this.orderToUpdate || !this.orderToUpdate.id) return;

    try {
      // Update status in Firestore
      const orderRef = doc(this.firestore, 'orders', this.orderToUpdate.id);
      await updateDoc(orderRef, {
        status: this.newStatus,
        updatedAt: Timestamp.now()
      });

      this.successMessage.set('Estado actualizado correctamente');
      setTimeout(() => this.successMessage.set(''), 3000);
      
      this.closeStatusModal();
    } catch (error) {
      console.error('Error updating status:', error);
      this.errorMessage.set('Error al actualizar el estado');
      setTimeout(() => this.errorMessage.set(''), 3000);
    }
  }
  
  async updateTracking(): Promise<void> {
    if (!this.orderToUpdate || !this.orderToUpdate.id || !this.trackingNumber.trim()) return;

    try {
      const orderRef = doc(this.firestore, 'orders', this.orderToUpdate.id);
      await updateDoc(orderRef, {
        trackingNumber: this.trackingNumber,
        updatedAt: Timestamp.now()
      });

      this.successMessage.set('Número de seguimiento actualizado');
      setTimeout(() => this.successMessage.set(''), 3000);
      
      this.trackingNumber = '';
    } catch (error) {
      console.error('Error updating tracking:', error);
      this.errorMessage.set('Error al actualizar el seguimiento');
      setTimeout(() => this.errorMessage.set(''), 3000);
    }
  }

  async logout(): Promise<void> {
    await this.authService.signOutUser();
    this.router.navigate(['/client/login']);
  }
}
