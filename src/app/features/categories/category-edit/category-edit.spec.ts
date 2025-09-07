// src/app/features/category/category-edit/category-edit.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { CategoryEdit } from './category-edit';
import { CategoryService, CategoryDto, GenericResponseV2 } from '../../../core/category.service';

describe('CategoryEdit', () => {
  let component: CategoryEdit;
  let fixture: ComponentFixture<CategoryEdit>;
  let service: CategoryService;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CategoryEdit],
      imports: [
        ReactiveFormsModule,
        RouterTestingModule,
        HttpClientTestingModule
      ],
      providers: [CategoryService]
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryEdit);
    component = fixture.componentInstance;
    service = TestBed.inject(CategoryService);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify(); // ensure no outstanding requests
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form', () => {
    expect(component.categoryForm).toBeDefined();
    expect(component.categoryForm.get('name')).toBeTruthy();
    expect(component.categoryForm.get('description')).toBeTruthy();
  });

  it('should show error if name is empty on submit', () => {
    component.categoryForm.setValue({ name: '', description: '' });
    component.onSubmit();
    expect(component.categoryForm.invalid).toBeTrue();
  });

  it('should call add when no categoryId is set', () => {
    const dummyCategory: CategoryDto = { name: 'Test Category', description: 'Test Desc' };
    const mockResponse: GenericResponseV2<CategoryDto> = {
      status: 'SUCCESS',
      message: 'Category created',
      data: { id: 1, name: 'Test Category', description: 'Test Desc' }
    };

    component.categoryForm.setValue(dummyCategory);
    component.onSubmit();

    const req = httpMock.expectOne('http://localhost:8080/api/v1/category/add');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should call update when categoryId is set', () => {
    const dummyCategory: CategoryDto = { name: 'Updated Name', description: 'Updated Desc' };
    const mockResponse: GenericResponseV2<CategoryDto> = {
      status: 'SUCCESS',
      message: 'Category updated',
      data: { id: 1, name: 'Updated Name', description: 'Updated Desc' }
    };

    component.categoryId = 1;
    component.isEditMode = true;
    component.categoryForm.setValue(dummyCategory);
    component.onSubmit();

    const req = httpMock.expectOne('http://localhost:8080/api/v1/category/update/1');
    expect(req.request.method).toBe('PUT');
    req.flush(mockResponse);
  });

  it('should handle service error on submit', () => {
    component.categoryId = 1;
    component.isEditMode = true;
    const dummyCategory: CategoryDto = { name: 'Error Test', description: '' };

    component.categoryForm.setValue(dummyCategory);
    component.onSubmit();

    const req = httpMock.expectOne('http://localhost:8080/api/v1/category/update/1');
    req.error(new ErrorEvent('Network error'));

    expect(component.errorMessage).toBe('Failed to save category. Please try again.');
  });
});
