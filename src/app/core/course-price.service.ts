import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export enum PriceStatus {
  FREE = 'FREE',
  DISCOUNTED = 'DISCOUNTED',
  FULL_PRICE = 'FULL_PRICE'
}

export interface CoursePriceDto {
  id?: number;
  courseId?: number;
  isFree?: boolean;
  price?: number;
  originalPrice?: number;
  priceActivationDate?: string;
  discountPrice?: number;
  discountStartTime?: string;
  discountEndTime?: string;
  createdAt?: string;
  updatedAt?: string;

  // Computed fields from backend
  priceStatus?: PriceStatus;
  currentPrice?: number;
  discountPercentage?: number;
  isDiscountActive?: boolean;
  isPriceActive?: boolean;
}

export interface CoursePriceRequest {
  price: number;
  originalPrice?: number;
  priceActivationDate?: string;
}

export interface CourseDiscountRequest {
  discountPrice: number;
  discountStartTime: string;
  discountEndTime: string;
}

interface GenericResponseV2<T> {
  status: string;
  message: string;
  _embedded?: T;
}

@Injectable({
  providedIn: 'root'
})
export class CoursePriceService {
  private apiUrl = 'http://localhost:8080/api/v1/course-price';

  constructor(private http: HttpClient) {}

  // Set or update course price
  setCoursePrice(courseId: number, priceRequest: CoursePriceRequest): Observable<CoursePriceDto> {
    return this.http.post<GenericResponseV2<CoursePriceDto>>(
      `${this.apiUrl}/set/${courseId}`,
      priceRequest
    ).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to set course price');
      })
    );
  }

  // Create a new discount for a course
  createCourseDiscount(courseId: number, discountRequest: CourseDiscountRequest): Observable<CoursePriceDto> {
    return this.http.post<GenericResponseV2<CoursePriceDto>>(
      `${this.apiUrl}/discount/create/${courseId}`,
      discountRequest
    ).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to create course discount');
      })
    );
  }

  // Update existing discount
  updateCourseDiscount(courseId: number, discountRequest: CourseDiscountRequest): Observable<CoursePriceDto> {
    return this.http.put<GenericResponseV2<CoursePriceDto>>(
      `${this.apiUrl}/discount/update/${courseId}`,
      discountRequest
    ).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to update course discount');
      })
    );
  }

  // Remove discount from course
  removeCourseDiscount(courseId: number): Observable<CoursePriceDto> {
    return this.http.delete<GenericResponseV2<CoursePriceDto>>(
      `${this.apiUrl}/discount/remove/${courseId}`
    ).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to remove course discount');
      })
    );
  }

  // Make course free (removes price and discounts)
  makeCourseFree(courseId: number): Observable<CoursePriceDto> {
    return this.http.put<GenericResponseV2<CoursePriceDto>>(
      `${this.apiUrl}/make-free/${courseId}`,
      {}
    ).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to make course free');
      })
    );
  }

  // Get course pricing with all computed fields
  getCoursePricing(courseId: number): Observable<CoursePriceDto> {
    return this.http.get<GenericResponseV2<CoursePriceDto>>(
      `${this.apiUrl}/${courseId}`
    ).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to get course pricing');
      })
    );
  }

  // Format current price for display
  formatPrice(coursePrice: CoursePriceDto, currency: string = '$'): string {
    if (coursePrice.isFree) {
      return 'FREE';
    }
    const price = coursePrice.currentPrice ?? coursePrice.price ?? 0;
    return `${currency}${price.toFixed(2)}`;
  }

  // Format original price (for strikethrough display)
  formatOriginalPrice(coursePrice: CoursePriceDto, currency: string = '$'): string | null {
    if (coursePrice.isFree || !coursePrice.isDiscountActive || !coursePrice.originalPrice) {
      return null;
    }
    return `${currency}${coursePrice.originalPrice.toFixed(2)}`;
  }

  // Get all price display information in one call
  getPriceDisplayInfo(coursePrice: CoursePriceDto, currency: string = '$') {
    return {
      isFree: coursePrice.isFree ?? false,
      currentPrice: this.formatPrice(coursePrice, currency),
      originalPrice: this.formatOriginalPrice(coursePrice, currency),
      hasDiscount: coursePrice.isDiscountActive ?? false,
      discountPercentage: coursePrice.discountPercentage,
      priceStatus: coursePrice.priceStatus,
      isPriceActive: coursePrice.isPriceActive ?? false
    };
  }

  // Get discount badge text (e.g., "25% OFF")
  getDiscountBadgeText(coursePrice: CoursePriceDto): string | null {
    if (!coursePrice.isDiscountActive || !coursePrice.discountPercentage) {
      return null;
    }
    return `${coursePrice.discountPercentage}% OFF`;
  }

  // Get status badge with text and color class
  getStatusBadge(priceStatus?: PriceStatus): { text: string; colorClass: string } {
    switch (priceStatus) {
      case PriceStatus.FREE:
        return { text: 'Free', colorClass: 'bg-green-500' };
      case PriceStatus.DISCOUNTED:
        return { text: 'On Sale', colorClass: 'bg-red-500' };
      case PriceStatus.FULL_PRICE:
        return { text: 'Full Price', colorClass: 'bg-blue-500' };
      default:
        return { text: 'Unknown', colorClass: 'bg-gray-500' };
    }
  }

  // Check if price can be set (course is not free)
  canSetPrice(coursePrice: CoursePriceDto): boolean {
    return !coursePrice.isFree;
  }

  // Check if discount can be added
  canAddDiscount(coursePrice: CoursePriceDto): boolean {
    return !coursePrice.isFree && (coursePrice.price ?? 0) > 0;
  }

  // Check if course has a discount configured
  hasDiscount(coursePrice: CoursePriceDto): boolean {
    return !!(coursePrice.discountPrice && coursePrice.discountStartTime && coursePrice.discountEndTime);
  }

  // Format date for display
  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Format discount period (e.g., "Jan 1, 2024 - Jan 31, 2024")
  formatDiscountPeriod(coursePrice: CoursePriceDto): string | null {
    if (!this.hasDiscount(coursePrice)) {
      return null;
    }
    const start = this.formatDate(coursePrice.discountStartTime);
    const end = this.formatDate(coursePrice.discountEndTime);
    return `${start} - ${end}`;
  }
}