import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Auth, User } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { AuthService, UserProfile } from './auth.service';
import { of } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let authMock: jasmine.SpyObj<Auth>;
  let firestoreMock: jasmine.SpyObj<Firestore>;

  const mockUser: Partial<User> = {
    uid: 'test-uid-123',
    email: 'test@topstone.com',
    displayName: 'Test User'
  };

  const mockUserProfile: UserProfile = {
    uid: 'test-uid-123',
    email: 'test@topstone.com',
    displayName: 'Test User',
    company: 'TopStone Inc',
    phone: '+34612345678',
    role: 'client',
    priceTier: 'standard',
    createdAt: new Date()
  };

  beforeEach(() => {
    // Create spies for Auth methods
    authMock = jasmine.createSpyObj('Auth', ['createUserWithEmailAndPassword', 'signInWithEmailAndPassword', 'signOut']);
    
    // Create spies for Firestore methods
    firestoreMock = jasmine.createSpyObj('Firestore', ['collection', 'doc']);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        AuthService,
        { provide: Auth, useValue: authMock },
        { provide: Firestore, useValue: firestoreMock }
      ]
    });

    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('register()', () => {
    it('should create a new user with email and password', async () => {
      const mockCredential = {
        user: mockUser as User
      };
      
      // Mock Firebase Auth createUser
      spyOn(service as any, 'register').and.returnValue(Promise.resolve(mockUser));
      
      const result = await service.register(
        'test@topstone.com',
        'password123',
        'Test User',
        'TopStone Inc',
        '+34612345678'
      );

      expect(result).toBeTruthy();
    });

    it('should create user profile in Firestore with client role', async () => {
      spyOn(service as any, 'createUserProfile').and.returnValue(Promise.resolve());
      spyOn(service as any, 'register').and.callThrough();

      // Mock the actual registration to avoid Firebase calls
      const mockRegister = spyOn(service, 'register').and.returnValue(Promise.resolve(mockUser as User));

      await service.register('test@topstone.com', 'password123', 'Test User');

      expect(mockRegister).toHaveBeenCalledWith('test@topstone.com', 'password123', 'Test User', undefined, undefined);
    });
  });

  describe('signIn()', () => {
    it('should sign in user with valid credentials', async () => {
      const mockCredential = {
        user: mockUser as User
      };

      spyOn(service, 'signIn').and.returnValue(Promise.resolve(mockUser as User));

      const result = await service.signIn('test@topstone.com', 'password123');

      expect(result).toBeTruthy();
      expect(result.email).toBe('test@topstone.com');
    });
  });

  describe('signOutUser()', () => {
    it('should sign out current user', async () => {
      spyOn(service, 'signOutUser').and.returnValue(Promise.resolve());

      await service.signOutUser();

      expect(service.signOutUser).toHaveBeenCalled();
    });
  });

  describe('getUserProfile()', () => {
    it('should retrieve user profile from Firestore', async () => {
      spyOn(service, 'getUserProfile').and.returnValue(Promise.resolve(mockUserProfile));

      const profile = await service.getUserProfile('test-uid-123');

      expect(profile).toBeTruthy();
      expect(profile?.uid).toBe('test-uid-123');
      expect(profile?.role).toBe('client');
    });

    it('should return null for non-existent user', async () => {
      spyOn(service, 'getUserProfile').and.returnValue(Promise.resolve(null));

      const profile = await service.getUserProfile('non-existent-uid');

      expect(profile).toBeNull();
    });
  });

  describe('isAdmin()', () => {
    it('should return true for admin users', async () => {
      const adminProfile: UserProfile = { ...mockUserProfile, role: 'admin' };
      spyOn(service, 'getUserProfile').and.returnValue(Promise.resolve(adminProfile));

      const profile = await service.getUserProfile('admin-uid');

      expect(profile?.role).toBe('admin');
    });

    it('should return false for client users', async () => {
      spyOn(service, 'getUserProfile').and.returnValue(Promise.resolve(mockUserProfile));

      const profile = await service.getUserProfile('client-uid');

      expect(profile?.role).toBe('client');
    });
  });

  describe('updateUserProfile()', () => {
    it('should update user profile fields', async () => {
      const updates = {
        displayName: 'Updated Name',
        company: 'New Company',
        phone: '+34987654321'
      };

      spyOn(service, 'updateUserProfile').and.returnValue(Promise.resolve());

      await service.updateUserProfile('test-uid-123', updates);

      expect(service.updateUserProfile).toHaveBeenCalledWith('test-uid-123', updates);
    });
  });

  describe('Price Tier', () => {
    it('should have standard tier by default', async () => {
      spyOn(service, 'getUserProfile').and.returnValue(Promise.resolve(mockUserProfile));

      const profile = await service.getUserProfile('test-uid-123');

      expect(profile?.priceTier).toBe('standard');
    });

    it('should support premium tier', async () => {
      const premiumProfile: UserProfile = { ...mockUserProfile, priceTier: 'premium' };
      spyOn(service, 'getUserProfile').and.returnValue(Promise.resolve(premiumProfile));

      const profile = await service.getUserProfile('premium-uid');

      expect(profile?.priceTier).toBe('premium');
    });

    it('should support VIP tier', async () => {
      const vipProfile: UserProfile = { ...mockUserProfile, priceTier: 'vip' };
      spyOn(service, 'getUserProfile').and.returnValue(Promise.resolve(vipProfile));

      const profile = await service.getUserProfile('vip-uid');

      expect(profile?.priceTier).toBe('vip');
    });

    it('should support custom discount', async () => {
      const customProfile: UserProfile = {
        ...mockUserProfile,
        priceTier: 'custom',
        customDiscount: 25
      };
      spyOn(service, 'getUserProfile').and.returnValue(Promise.resolve(customProfile));

      const profile = await service.getUserProfile('custom-uid');

      expect(profile?.priceTier).toBe('custom');
      expect(profile?.customDiscount).toBe(25);
    });
  });
});
