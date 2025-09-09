import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Component } from '@angular/core';

import { CategoryEdit } from './category-edit';
import { CategoryService, CategoryDto, GenericResponseV2 } from '../../../core/category.service';

@Component({ template: '' })
class TestComponent { }

describe('CategoryEdit', () => {
  let component: CategoryEdit;
  let fixture: ComponentFixture<CategoryEdit>;
  let service: CategoryService;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [CategoryEdit],
      imports: [ReactiveFormsModule, HttpClientTestingModule],
      providers: [
        CategoryService,
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryEdit);
    component = fixture.componentInstance;
    service = TestBed.inject(CategoryService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with validators', () => {
    expect(component.categoryForm).toBeDefined();
    expect(component.categoryForm.get('name')).toBeTruthy();
    expect(component.categoryForm.get('description')).toBeTruthy();

    const nameControl = component.categoryForm.get('name');
    nameControl?.setValue('');
    expect(nameControl?.hasError('required')).toBeTruthy();
  });

  it('should handle form submission for new category', () => {
    const categoryData: CategoryDto = { 
      name: 'Test Category', 
      description: 'Test Description' 
    };

    component.categoryForm.patchValue(categoryData);
    component.onSubmit();

    const req = httpMock.expectOne('http://localhost:8080/api/v1/category/add');
    expect(req.request.method).toBe('POST');
    
    const response: GenericResponseV2<CategoryDto> = {
      status: 'SUCCESS',
      message: 'Category created',
     _embedded: { id: 1, ...categoryData }
    };
    req.flush(response);
  });

  it('should handle form submission for existing category', () => {
    const categoryData: CategoryDto = { 
      name: 'Updated Category', 
      description: 'Updated Description' 
    };

    component.categoryId = 1;
    component.isEditMode = true;
    component.categoryForm.patchValue(categoryData);
    component.onSubmit();

    const req = httpMock.expectOne('http://localhost:8080/api/v1/category/update/1');
    expect(req.request.method).toBe('PUT');
    
    const response: GenericResponseV2<CategoryDto> = {
      status: 'SUCCESS',
      message: 'Category updated',
      _embedded: { id: 1, ...categoryData }
    };
    req.flush(response);
  });

  it('should load category data in edit mode', () => {
    const categoryData: CategoryDto = { 
      id: 1, 
      name: 'Existing Category', 
      description: 'Existing Description' 
    };

    component.categoryId = 1;
    component.loadCategory();

    const req = httpMock.expectOne('http://localhost:8080/api/v1/category/1');
    expect(req.request.method).toBe('GET');
    
    const response: GenericResponseV2<CategoryDto> = {
      status: 'SUCCESS',
      message: 'Category fetched',
      _embedded: categoryData
    };
    req.flush(response);

    expect(component.categoryForm.get('name')?.value).toBe(categoryData.name);
    expect(component.categoryForm.get('description')?.value).toBe(categoryData.description);
  });

  it('should handle service errors', () => {
    component.categoryId = 1;
    component.isEditMode = true;
    component.categoryForm.patchValue({ name: 'Test', description: '' });
    
    component.onSubmit();

    const req = httpMock.expectOne('http://localhost:8080/api/v1/category/update/1');
    req.error(new ProgressEvent('Network error'));

    expect(component.errorMessage).toBeTruthy();
    expect(component.isSaving).toBeFalse();
  });

  it('should handle cancel with dirty form', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    
    component.categoryForm.markAsDirty();
    component.onCancel();
    
    expect(window.confirm).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should reset form', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    
    component.categoryForm.patchValue({ name: 'Test', description: 'Test' });
    component.categoryForm.markAsDirty();
    
    component.onReset();
    
    expect(window.confirm).toHaveBeenCalled();
    expect(component.categoryForm.pristine).toBeTruthy();
  });
});