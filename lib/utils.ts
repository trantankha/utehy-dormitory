import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface PaginatedResult<T> {
  data: T[]
  currentPage: number
  totalPages: number
  totalItems: number
  hasNext: boolean
  hasPrev: boolean
}

export function paginate<T>(
  data: T[],
  page: number = 1,
  limit: number = 10
): PaginatedResult<T> {
  const totalItems = data.length
  const totalPages = Math.ceil(totalItems / limit)

  // If data is less than or equal to limit, return all as single page
  if (totalItems <= limit) {
    return {
      data,
      currentPage: 1,
      totalPages: 1,
      totalItems,
      hasNext: false,
      hasPrev: false,
    }
  }

  // Ensure page is within bounds
  const currentPage = Math.max(1, Math.min(page, totalPages))
  const startIndex = (currentPage - 1) * limit
  const endIndex = startIndex + limit

  return {
    data: data.slice(startIndex, endIndex),
    currentPage,
    totalPages,
    totalItems,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}
