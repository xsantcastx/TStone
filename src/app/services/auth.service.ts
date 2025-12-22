import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  user,
  User,
  updateProfile
} from '@angular/fire/auth';
import { 
  Firestore, 
  doc, 
  setDoc, 
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  orderBy
} from '@angular/fire/firestore';
import { Observable, from, of, switchMap } from 'rxjs';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  company?: string;
  phone?: string;
  role: 'client' | 'admin';
  priceTier?: 'standard' | 'premium' | 'vip' | 'custom';  // Price tier for discounts
  customDiscount?: number;  // Custom discount percentage (0-100)
  createdAt: Date;
  updatedAt?: Date;
  disabled?: boolean;
  lastLogin?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  
  // Observable of current user
  user$ = user(this.auth);
  
  // Observable of current user profile
  userProfile$: Observable<UserProfile | null> = this.user$.pipe(
    switchMap(user => {
      if (!user) return of(null);
      return from(this.getUserProfile(user.uid));
    })
  );

  // Register new user
  async register(email: string, password: string, displayName: string, company?: string, phone?: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
    const user = userCredential.user;

    // Update profile
    await updateProfile(user, { displayName });

    // Create user document in Firestore
    await this.createUserProfile(user.uid, {
      uid: user.uid,
      email: email,
      displayName: displayName,
      company: company,
      phone: phone,
      role: 'client',
      createdAt: new Date()
    });

    return user;
  }

  // Sign in
  async signIn(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
    return userCredential.user;
  }

  // Sign out
  async signOutUser(): Promise<void> {
    await signOut(this.auth);
  }

  // Create user profile in Firestore
  private async createUserProfile(uid: string, profile: UserProfile): Promise<void> {
    const userDoc = doc(this.firestore, `users/${uid}`);
    await setDoc(userDoc, profile);
  }

  // Get user profile
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const userDoc = doc(this.firestore, `users/${uid}`);
    const docSnap = await getDoc(userDoc);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data();
    
    // Convert Firestore Timestamps to Date objects
    return {
      ...data,
      createdAt: data['createdAt']?.toDate ? data['createdAt'].toDate() : data['createdAt'],
      updatedAt: data['updatedAt']?.toDate ? data['updatedAt'].toDate() : data['updatedAt'],
      lastLogin: data['lastLogin']?.toDate ? data['lastLogin'].toDate() : data['lastLogin']
    } as UserProfile;
  }

  // Update user profile
  async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    const userDoc = doc(this.firestore, `users/${uid}`);
    await updateDoc(userDoc, {
      ...data,
      updatedAt: new Date()
    });
  }

  // Check if user is admin
  async isAdmin(uid: string): Promise<boolean> {
    const profile = await this.getUserProfile(uid);
    return profile?.role === 'admin';
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  // Get all users (admin only)
  async getAllUsers(): Promise<UserProfile[]> {
    const usersCol = collection(this.firestore, 'users');
    const q = query(usersCol, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as UserProfile);
  }

  // Update user role (admin only)
  async updateUserRole(uid: string, role: 'admin' | 'client'): Promise<void> {
    const userDoc = doc(this.firestore, `users/${uid}`);
    await updateDoc(userDoc, {
      role,
      updatedAt: new Date()
    });
  }

  // Update user status (enable/disable) (admin only)
  async updateUserStatus(uid: string, disabled: boolean): Promise<void> {
    const userDoc = doc(this.firestore, `users/${uid}`);
    await updateDoc(userDoc, {
      disabled,
      updatedAt: new Date()
    });
  }
}
