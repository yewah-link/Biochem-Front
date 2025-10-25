import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router } from '@angular/router';
import { adminGuard } from './admin.guard';
import { AuthService } from './auth.service';

describe('adminGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
      TestBed.runInInjectionContext(() => adminGuard(...guardParameters));

  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'isAdmin']);
    mockRouter = jasmine.createSpyObj('Router', ['parseUrl']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  it('should allow access for logged in admin users', () => {
    mockAuthService.isLoggedIn.and.returnValue(true);
    mockAuthService.isAdmin.and.returnValue(true);

    expect(executeGuard).toBeTruthy();
  });

  it('should redirect non-admin users to login', () => {
    mockAuthService.isLoggedIn.and.returnValue(true);
    mockAuthService.isAdmin.and.returnValue(false);

    expect(executeGuard).toBeTruthy();
    expect(mockRouter.parseUrl).toHaveBeenCalledWith('/login');
  });

  it('should redirect non-logged in users to login', () => {
    mockAuthService.isLoggedIn.and.returnValue(false);
    mockAuthService.isAdmin.and.returnValue(false);

    expect(executeGuard).toBeTruthy();
    expect(mockRouter.parseUrl).toHaveBeenCalledWith('/login');
  });
});
