import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Firestore, addDoc, collection, serverTimestamp, doc, getDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { CartService } from '../../services/cart.service';
import { EmailService } from '../../services/email.service';

@Component({
  standalone: true,
  selector: 'ts-cart-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule],
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss']
})
export class CartPage implements OnInit {
  private fb = inject(FormBuilder);
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  cart = inject(CartService);
  mail = inject(EmailService);

  vm$ = this.cart.cart$; // { items: CartItem[] }

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    message: [''],
  });

  submitting = false;
  success: string | null = null;
  error: string | null = null;

  async ngOnInit() {
    // Load user data if logged in
    const user = this.auth.currentUser;
    if (user) {
      try {
        const userDocRef = doc(this.firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          this.form.patchValue({
            name: userData['displayName'] || userData['name'] || user.displayName || '',
            email: userData['email'] || user.email || '',
            phone: userData['phone'] || userData['phoneNumber'] || ''
          });
        } else {
          // Use Firebase Auth data if no Firestore user doc
          this.form.patchValue({
            name: user.displayName || '',
            email: user.email || ''
          });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        // Fallback to Auth data
        if (user.displayName || user.email) {
          this.form.patchValue({
            name: user.displayName || '',
            email: user.email || ''
          });
        }
      }
    }
  }

  updateQty(id: string, q: string) { this.cart.updateQty(id, +q); }
  remove(id: string) { this.cart.remove(id); }
  clear() { this.cart.clear(); }

  async submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const state = this.cart.snapshot();
    if (!state.items.length) { this.error = 'El carrito está vacío.'; return; }
    this.submitting = true; this.error = null; this.success = null;

    try {
      const orderItems = state.items.map(i => ({
        id: i.product.id || '', 
        name: i.product.name || '', 
        sku: i.product.sku || '',
        thickness: i.product.grosor || '', 
        qty: i.qty || 1,
      }));

      // Create order in Firestore
      const orderDoc = await addDoc(collection(this.firestore, 'orders'), {
        customerName: this.form.value.name || '',
        customerEmail: this.form.value.email || '',
        customerPhone: this.form.value.phone || '',
        message: this.form.value.message || '',
        items: orderItems,
        itemCount: state.items.length,
        status: 'pending',
        createdAt: serverTimestamp(),
        source: 'cart'
      });

      console.log('Order created with ID:', orderDoc.id);

      // Send email notification
      await this.mail.sendCartEmail({
        contact: this.form.value,
        items: orderItems,
      });

      this.success = '¡Enviado! Te contactaremos en breve.';
      this.cart.clear();
      this.form.reset();
    } catch (e: any) {
      console.error('Error submitting cart:', e);
      this.error = 'No pudimos enviar el correo. Intenta más tarde.';
    } finally {
      this.submitting = false;
    }
  }
}