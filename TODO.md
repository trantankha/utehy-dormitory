# Payment Integration Implementation Plan

## Phase 1: Database Schema & Models
- [ ] Add Payment model to schema.prisma
- [ ] Add PaymentMethod model to schema.prisma
- [ ] Update Registration model to link with Payment
- [ ] Run database migration
- [ ] Update Prisma client

## Phase 2: Payment Integration (VNPay)
- [ ] Install VNPay SDK/library
- [ ] Create payment configuration (lib/payment.ts)
- [ ] Create VNPay integration utilities
- [ ] Add environment variables for VNPay

## Phase 3: Server Actions
- [ ] Create payment actions (actions/payment.ts)
  - [ ] createPaymentAction - Tạo thanh toán mới
  - [ ] verifyPaymentAction - Xác nhận thanh toán từ VNPay
  - [ ] getPaymentHistoryAction - Lịch sử thanh toán
  - [ ] refundPaymentAction - Hoàn tiền (nếu cần)
- [ ] Update registration actions to include payment flow
- [ ] Add payment validation schemas

## Phase 4: UI Components
- [ ] PaymentForm component - Form thanh toán
- [ ] PaymentHistory component - Lịch sử thanh toán
- [ ] PaymentStatusBadge - Badge trạng thái
- [ ] QRCodePayment - Thanh toán qua QR code
- [ ] PaymentDialog - Dialog thanh toán

## Phase 5: Integration with Registration Flow
- [ ] Update registration status flow to include payment
- [ ] Modify admin approval to trigger payment requirement
- [ ] Update student dashboard with payment options
- [ ] Add payment notifications

## Phase 6: Testing & Demo
- [ ] Test payment creation flow
- [ ] Test VNPay callback handling
- [ ] Test payment verification
- [ ] Test edge cases (failed payments, timeouts)
- [ ] Create demo payment scenarios

## Phase 7: Documentation
- [ ] Update docs/01-ARCHITECTURE.md with payment flow
- [ ] Update docs/02-BUSINESS-LOGIC.md with payment rules
- [ ] Create docs/06-PAYMENT-INTEGRATION.md
- [ ] Update README.md with payment features
- [ ] Add API documentation for payment endpoints

## Current Status: Starting Phase 1
