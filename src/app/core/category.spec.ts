import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CategoryService, CategoryDto, GenericResponseV2 } from './category.service';

describe('CategoryService', () => {
  let service: CategoryService;
  let httpMock: HttpTestingController;
  const baseUrl = 'http://localhost:8080/api/v1/category';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CategoryService]
    });

    service = TestBed.inject(CategoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add category', () => {
    const category: CategoryDto = { name: 'Test Category', description: 'Test Description' };
    const response: GenericResponseV2<CategoryDto> = {
      status: 'SUCCESS',
      message: 'Category created',
      data: { id: 1, ...category }
    };

    service.add(category).subscribe(res => {
      expect(res.status).toBe('SUCCESS');
      expect(res.data.name).toBe('Test Category');
    });

    const req = httpMock.expectOne(`${baseUrl}/add`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(category);
    req.flush(response);
  });

  it('should update category', () => {
    const categoryId = 1;
    const category: CategoryDto = { name: 'Updated Category', description: 'Updated Description' };
    const response: GenericResponseV2<CategoryDto> = {
      status: 'SUCCESS',
      message: 'Category updated',
      data: { id: categoryId, ...category }
    };

    service.update(categoryId, category).subscribe(res => {
      expect(res.status).toBe('SUCCESS');
      expect(res.data.name).toBe('Updated Category');
    });

    const req = httpMock.expectOne(`${baseUrl}/update/${categoryId}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(category);
    req.flush(response);
  });

  it('should delete category', () => {
    const categoryId = 1;
    const response: GenericResponseV2<void> = {
      status: 'SUCCESS',
      message: 'Category deleted',
      data: undefined
    };

    service.delete(categoryId).subscribe(res => {
      expect(res.status).toBe('SUCCESS');
    });

    const req = httpMock.expectOne(`${baseUrl}/delete/${categoryId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(response);
  });

  it('should get category by id', () => {
    const categoryId = 1;
    const response: GenericResponseV2<CategoryDto> = {
      status: 'SUCCESS',
      message: 'Category fetched',
      data: { id: categoryId, name: 'Test Category', description: 'Test Description' }
    };

    service.getById(categoryId).subscribe(res => {
      expect(res.status).toBe('SUCCESS');
      expect(res.data.id).toBe(categoryId);
      expect(res.data.name).toBe('Test Category');
    });

    const req = httpMock.expectOne(`${baseUrl}/${categoryId}`);
    expect(req.request.method).toBe('GET');
    req.flush(response);
  });
});