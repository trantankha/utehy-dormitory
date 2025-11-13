# Contract Extension Implementation TODO

## Phase 1: Backend Implementation
- [x] Add contract extension validation schema in `lib/validations/registration.ts`
- [x] Create `extendContractAction` in `actions/registration.ts`
  - [x] Check student's current active registration (DA_THANH_TOAN or DA_XAC_NHAN)
  - [x] Get next semester using existing utility
  - [x] Verify room/bed availability for next semester
  - [x] Create new registration in transaction if available
  - [x] Handle conflicts when room/bed not available

## Phase 2: Documentation & Roadmap
- [x] Update README.md roadmap to mark contract renewal as completed
- [x] Write documentation in `docs/contract-extension.md` describing the architecture

## Phase 3: Frontend Implementation
- [x] Create UI component for contract extension (student side)
- [x] Build display interfaces for students to view and manipulate contract extensions
- [x] Build admin interfaces to view and manage contract extensions

## Phase 4: Testing & Validation
- [ ] Test the functionality with existing test accounts
- [ ] Verify transaction consistency
- [ ] Check edge cases (room full, bed unavailable)
- [ ] Ensure documentation is accurate and interfaces are user-friendly
