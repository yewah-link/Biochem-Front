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

     //check if course will becomepaid in future

      willBecomePaid(coursePrice: CoursePriceDto): boolean {
      // Must have a price activation date to count as "will become paid"
      if (!coursePrice || !coursePrice.priceActivationDate) {
        return false;
      }

      const activationDate = new Date(coursePrice.priceActivationDate);
      const now = new Date();

      // If activation date is in the future → countdown should be active
      return activationDate.getTime() > now.getTime();
    }


  /**
 * Get time remaining until price activation
 * Returns null if no future pricing or already activated
 */
  getTimeUntilPriceActivation(coursePrice: CoursePriceDto): {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalMilliseconds: number;
  } | null {
    if (!this.willBecomePaid(coursePrice)) {
      return null;
    }
    
    const activationDate = new Date(coursePrice.priceActivationDate!);
    const now = new Date();
    const diff = activationDate.getTime() - now.getTime();
    
    if (diff <= 0) {
      return null;
    }
    
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      totalMilliseconds: diff
    };
  } 

  /**
 * Format countdown for display (compact version)
 */
formatCountdown(coursePrice: CoursePriceDto): string | null {
  const timeRemaining = this.getTimeUntilPriceActivation(coursePrice);

  if (!timeRemaining) {
    return null;
  }

  const { days, hours, minutes, seconds } = timeRemaining;

  // Always include seconds
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}


/**
 * Format countdown for display (full version with labels)
 */
formatCountdownFull(coursePrice: CoursePriceDto): string | null {
  const timeRemaining = this.getTimeUntilPriceActivation(coursePrice);

  if (!timeRemaining) return null;

  const { days, hours, minutes, seconds } = timeRemaining;

  const parts: string[] = [];

  if (days > 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  
  // Always include seconds
  parts.push(`${seconds} ${seconds === 1 ? 'second' : 'seconds'}`);

  return parts.join(', ');
}


/**
 * Get countdown message with context and future price
 */
getCountdownMessage(coursePrice: CoursePriceDto): string | null {
  const countdown = this.formatCountdown(coursePrice);
  
  if (!countdown) {
    return null;
  }
  
  // Calculate what the price will be
  const futurePrice = coursePrice.priceActivationDate ? (coursePrice.price ?? 0): 0;
  
  return `Free for ${countdown} - Then $${futurePrice.toFixed(2)}`;
}

/**
 * urgency level based on time remaining
 * Useful for styling (red for urgent, yellow for warning, green for plenty of time)
 */
getCountdownUrgency(coursePrice: CoursePriceDto): 'critical' | 'warning' | 'normal' | null {
  const timeRemaining = this.getTimeUntilPriceActivation(coursePrice);
  
  if (!timeRemaining) {
    return null;
  }
  
  const totalHours = timeRemaining.totalMilliseconds / (1000 * 60 * 60);
  
  if (totalHours <= 24) {
    return 'critical'; // Less than 24 hours - red
  } else if (totalHours <= 72) {
    return 'warning'; // Less than 3 days - yellow
  } else {
    return 'normal'; // More than 3 days - green
  }
}

/**
 * Get countdown badge color based on urgency
 */
getCountdownBadgeColor(coursePrice: CoursePriceDto): string {
  const urgency = this.getCountdownUrgency(coursePrice);
  
  switch (urgency) {
    case 'critical':
      return 'from-red-500 to-red-600'; // Red for urgent
    case 'warning':
      return 'from-orange-500 to-orange-600'; // Orange for warning
    case 'normal':
      return 'from-green-500 to-emerald-600'; // Green for normal
    default:
      return 'from-pink-500 to-pink-600'; // Default pink
  }
}


}