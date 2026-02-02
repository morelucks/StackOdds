;; Reward Vault Contract
;; 
;; Securely holds STX rewards and distributes them to users based 
;; on their total impact score registered in the rewards-registry contract.

(define-constant ERR-NOT-AUTHORIZED (err u200))
(define-constant ERR-INSUFFICIENT-FUNDS (err u201))
(define-constant ERR-ALREADY-CLAIMED (err u202))
(define-constant ERR-REGISTRY-NOT-FOUND (err u203))

(define-data-var vault-owner principal tx-sender)
(define-data-var reward-rate uint u100) ;; Microstacks per impact point

(define-map user-claims principal uint) ;; Tracks the last score height claimed

;; Public Functions

;; users can claim rewards for any new impact points earned since their last claim
(define-public (claim-rewards (registry-contract <registry-trait>))
  (let
    (
      (caller tx-sender)
      (user-data (unwrap! (contract-call? registry-contract get-user-data caller) ERR-REGISTRY-NOT-FOUND))
      (total-score (get total-impact-score user-data))
      (last-claimed-score (default-to u0 (map-get? user-claims caller)))
      (new-points (- total-score last-claimed-score))
      (reward-amount (* new-points (var-get reward-rate)))
    )
    (asserts! (> new-points u0) ERR-ALREADY-CLAIMED)
    (asserts! (>= (stx-get-balance (as-contract tx-sender)) reward-amount) ERR-INSUFFICIENT-FUNDS)
    
    (map-set user-claims caller total-score)
    (as-contract (stx-transfer? reward-amount tx-sender caller))
  )
)

;; Admin: Fund the vault
(define-public (deposit-rewards (amount uint))
  (stx-transfer? amount tx-sender (as-contract tx-sender))
)

;; Admin: Set reward rate
(define-public (set-reward-rate (new-rate uint))
  (begin
    (asserts! (is-eq tx-sender (var-get vault-owner)) ERR-NOT-AUTHORIZED)
    (ok (var-set reward-rate new-rate))
  )
)

;; Read-only Functions

(define-read-only (get-claimable-amount (user principal) (total-score uint))
  (let
    (
      (last-claimed (default-to u0 (map-get? user-claims user)))
      (new-points (if (> total-score last-claimed) (- total-score last-claimed) u0))
    )
    (* new-points (var-get reward-rate))
  )
)

;; Define the trait locally for simplicity
(define-trait registry-trait
  (
    (get-user-data (principal) (optional {github-handle: (string-ascii 40), registration-height: uint, total-impact-score: uint, last-update-height: uint}))
  )
)
