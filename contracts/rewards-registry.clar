;; Rewards Registry Contract
;; 
;; This contract allows users to register their GitHub handles and tracks 
;; their activity and impact on the Stacks blockchain for the StackOdds rewards program.

(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-ALREADY-REGISTERED (err u101))
(define-constant ERR-NOT-REGISTERED (err u102))

(define-map user-registrations
  principal
  {
    github-handle: (string-ascii 40),
    registration-height: uint,
    total-impact-score: uint,
    last-update-height: uint
  }
)

(define-data-var contract-owner principal tx-sender)

;; Public Functions

;; Register a new user with their GitHub handle
(define-public (register-user (handle (string-ascii 40)))
  (let
    (
      (caller tx-sender)
    )
    (asserts! (is-none (map-get? user-registrations caller)) ERR-ALREADY-REGISTERED)
    (ok (map-set user-registrations caller
      {
        github-handle: handle,
        registration-height: block-height,
        total-impact-score: u0,
        last-update-height: block-height
      }
    ))
  )
)

;; Update impact score (only callable by contract owner or authorized oracle)
(define-public (update-score (user principal) (new-score uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-AUTHORIZED)
    (let
      (
        (current-data (unwrap! (map-get? user-registrations user) ERR-NOT-REGISTERED))
      )
      (ok (map-set user-registrations user
        (merge current-data {
          total-impact-score: new-score,
          last-update-height: block-height
        })
      ))
    )
  )
)

;; Transfer ownership
(define-public (set-owner (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-AUTHORIZED)
    (ok (var-set contract-owner new-owner))
  )
)

;; Read-only Functions

(define-read-only (get-user-data (user principal))
  (map-get? user-registrations user)
)

(define-read-only (get-owner)
  (ok (var-get contract-owner))
)
