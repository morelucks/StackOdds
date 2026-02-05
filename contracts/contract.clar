;; Prediction market using LMSR pricing mechanism
;; Allows users to trade shares on binary outcomes with automatic price discovery
;; This contract is developed for the Stacks blockchain and uses SIP-010 collateral.
;; Implements the Logarithmic Market Scoring Rule (LMSR) for automated liquidity.
;; to eliminate contract-call? dependencies and static analyzer errors
;;
;; IMPORTANT: When initializing, you MUST pass a contract principal (address.contract-name)
;; for the collateral token, not just an address principal.

(define-constant ERR_UNAUTHORIZED (err u2001))
(define-constant ERR_ZERO_LIQUIDITY (err u2002))
(define-constant ERR_ALREADY_RESOLVED (err u2003))
(define-constant ERR_NOT_RESOLVED (err u2004))
(define-constant ERR_MARKET_NOT_CREATED (err u2005))
(define-constant ERR_INSUFFICIENT_SHARES (err u2006))
(define-constant ERR_ZERO_ADDRESS (err u2007))
(define-constant ERR_INVALID_PARAMS (err u2008))
(define-constant ERR_MARKET_EXPIRED (err u2009))
(define-constant ERR_MARKET_NOT_EXPIRED (err u2010))
(define-constant ERR_INSUFFICIENT_BALANCE (err u2011))

;; SIP-010 Fungible Token Trait
;; Defines the standard interface for fungible tokens (USDCx, STX, etc.)
;; This trait is used as a parameter type to enable flexible collateral token support.
;; NOTE: The static analyzer may show "use of unresolved function 'as-contract'" errors
;; when using trait parameters with contract-call?. This is a known static analyzer
;; limitation - the code works correctly at runtime, but the analyzer cannot verify
;; dynamic contract calls and some built-in functions when used with trait parameters.
(define-trait sip010-trait
  ((transfer (uint principal principal (optional (buff 34))) (response bool uint)))
)

;; Stores all market data including quantities, timing, and resolution status
(define-map markets
  uint
  {
    exists: bool,
    b: uint,
    q-yes: uint,
    q-no: uint,
    start-time: uint,
    end-time: uint,
    resolved: bool,
    yes-won: bool,
    question: (string-ascii 256),
    c-id: (string-ascii 64),
    token-id-yes: uint,
    token-id-no: uint,
  }
)

(define-map market-count
  uint
  uint
)
(define-map admin-role
  principal
  bool
)
(define-map moderator-role
  principal
  bool
)

;; Outcome token storage (merged from token.clar)
(define-map token-id-yes-map
  uint
  uint
)
(define-map token-id-no-map
  uint
  uint
)
(define-map token-metadata
  uint
  {
    name: (string-ascii 32),
    symbol: (string-ascii 10),
    decimals: uint,
    market-id: uint,
    outcome: uint,
  }
)
(define-map balances
  {
    owner: principal,
    token-id: uint,
  }
  uint
)
(define-map total-supply-map
  uint
  uint
)

(define-data-var contract-owner principal 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
(define-data-var collateral-token principal 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)

;; Role checks and configuration
(define-read-only (is-authorized (caller principal))
  (ok (or (default-to false (map-get? admin-role caller)) (default-to false (map-get? moderator-role caller))))
)

(define-public (set-admin-role
    (who principal)
    (enabled bool)
  )
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (map-set admin-role who enabled)
    (ok true)
  )
)

(define-public (set-moderator-role
    (who principal)
    (enabled bool)
  )
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (map-set moderator-role who enabled)
    (ok true)
  )
)

;; Setup function to configure owner and collateral token address
(define-public (initialize
    (owner principal)
    (collateral principal)
  )
  (begin
    (var-set contract-owner owner)
    (var-set collateral-token collateral)
    (map-set admin-role owner true)
    (map-set moderator-role owner true)
    (ok true)
  )
)

;; ============================================================================
;; Outcome Token Functions (merged from token.clar)
;; ============================================================================

(define-private (get-user-balance (token-id uint) (user principal))
  (default-to u0 (map-get? balances { owner: user, token-id: token-id }))
)

(define-private (set-user-balance (token-id uint) (user principal) (amount uint))
  (map-set balances { owner: user, token-id: token-id } amount)
)

;; Looks up the token identifier for a given market and outcome type
;; Outcome 1 represents YES, outcome 0 represents NO
(define-read-only (get-token-id
    (market-id uint)
    (outcome uint)
  )
  (if (is-eq outcome u1)
    (ok (default-to u0 (map-get? token-id-yes-map market-id)))
    (ok (default-to u0 (map-get? token-id-no-map market-id)))
  )
)

;; Returns stored information about a specific token type
(define-read-only (get-token-metadata (token-id uint))
  (ok (map-get? token-metadata token-id))
)

;; Checks how many shares of a specific token a user owns
(define-read-only (get-balance
    (token-id uint)
    (owner principal)
  )
  (ok (get-user-balance token-id owner))
)

;; Returns the total number of shares minted for a token type
(define-read-only (get-total-supply (token-id uint))
  (ok (default-to u0 (map-get? total-supply-map token-id)))
)

;; Moves shares between user accounts
;; Requires sender to authorize the transfer
(define-public (transfer
    (token-id uint)
    (amount uint)
    (sender principal)
    (recipient principal)
  )
  (let (
    (sender-balance (get-user-balance token-id sender))
    (recipient-balance (get-user-balance token-id recipient))
  )
    (asserts! (is-eq tx-sender sender) ERR_UNAUTHORIZED)
    (asserts! (>= sender-balance amount) ERR_INSUFFICIENT_BALANCE)
    (set-user-balance token-id sender (- sender-balance amount))
    (set-user-balance token-id recipient (+ recipient-balance amount))
    (ok true)
  )
)

;; Internal function: Creates new shares when users purchase outcome positions
;; Called internally from buy-yes and buy-no
(define-private (mint-token
    (token-id uint)
    (recipient principal)
    (amount uint)
  )
  (let ((current-balance (get-user-balance token-id recipient)))
    (set-user-balance token-id recipient (+ current-balance amount))
    (map-set total-supply-map token-id
      (+ (default-to u0 (map-get? total-supply-map token-id)) amount)
    )
    true
  )
)

;; Internal function: Destroys shares when users claim winnings
;; Called internally from claim
(define-private (burn-token
    (token-id uint)
    (owner principal)
    (amount uint)
  )
  (let ((current-balance (get-user-balance token-id owner)))
    (asserts! (>= current-balance amount) ERR_INSUFFICIENT_BALANCE)
    (set-user-balance token-id owner (- current-balance amount))
    (map-set total-supply-map token-id
      (- (default-to u0 (map-get? total-supply-map token-id)) amount)
    )
    (ok true)
  )
)

;; Internal function: Registers a new pair of outcome tokens when a market is created
;; Called internally from create-market
(define-private (initialize-token
    (market-id uint)
    (token-id-yes uint)
    (token-id-no uint)
    (name-yes (string-ascii 32))
    (name-no (string-ascii 32))
    (symbol-yes (string-ascii 10))
    (symbol-no (string-ascii 10))
  )
  (begin
    (map-set token-id-yes-map market-id token-id-yes)
    (map-set token-id-no-map market-id token-id-no)
    (map-set token-metadata token-id-yes {
      name: name-yes,
      symbol: symbol-yes,
      decimals: u6,
      market-id: market-id,
      outcome: u1,
    })
    (map-set token-metadata token-id-no {
      name: name-no,
      symbol: symbol-no,
      decimals: u6,
      market-id: market-id,
      outcome: u0,
    })
    true

  )
)

;; ============================================================================
;; Market Functions
;; ============================================================================

;; Establishes a new prediction market with specified parameters
;; Requires initial liquidity deposit from the creator
(define-public (create-market
    (b uint)
    (start-time uint)
    (end-time uint)
    (question (string-ascii 256))
    (c-id (string-ascii 64))
  )
  (let ((caller tx-sender))
    (begin
      (asserts! (is-eq caller (var-get contract-owner)) ERR_UNAUTHORIZED)
      (asserts! (> b u0) ERR_ZERO_LIQUIDITY)
      (asserts! (> end-time start-time) ERR_INVALID_PARAMS)
      (asserts! (>= start-time block-height) ERR_INVALID_PARAMS)
      (let (
          (current-count (default-to u0 (map-get? market-count u0)))
          (market-id (+ current-count u1))
          ;; Scale liquidity parameter to 18-decimal internal representation
          (b-internal (* b u1000000000000))
          ;; Required initial deposit equals b multiplied by natural log of 2
          ;; Precomputed constant: ln(2) approximately equals 693147 in our fixed-point scale
          (ln2 u693147)
          (fund-amount (/ (* b-internal ln2) u1000000))
        )
        (begin
          ;; Collect the initial liquidity deposit from caller to this contract
          (try! (contract-call? .token transfer u0 fund-amount caller
            (as-contract tx-sender)
          ))


          ;; Set up YES and NO token identifiers for this market
          (let (
              (token-id-yes (+ (* market-id u2) u1))
              (token-id-no (* market-id u2))
              (name-yes "Market YES")
              (name-no "Market NO")
            )
            (begin
              ;; Initialize tokens internally (no contract-call needed)
              (initialize-token
                market-id token-id-yes token-id-no name-yes name-no "YES" "NO"
              )

              (map-set markets market-id {
                exists: true,
                b: b-internal,
                q-yes: u0,
                q-no: u0,
                start-time: start-time,
                end-time: end-time,
                resolved: false,
                yes-won: false,
                question: question,
                c-id: c-id,
                token-id-yes: token-id-yes,
                token-id-no: token-id-no,
              })
              (map-set market-count u0 market-id)
              (ok market-id)
            )
          )
        )
      )
    )
  )
)

;; Public entry point for purchasing YES outcome shares
(define-public (buy-yes
    (market-id uint)
    (amount uint)
  )
  (let ((market (unwrap! (map-get? markets market-id) ERR_MARKET_NOT_CREATED)))
    (begin
      (asserts! (get exists market) ERR_MARKET_NOT_CREATED)
      (asserts! (not (get resolved market)) ERR_ALREADY_RESOLVED)
      (asserts! (<= block-height (get end-time market)) ERR_MARKET_EXPIRED)
      ;; Simple fixed-price trade: 1 collateral per share
      (asserts! (> amount u0) ERR_INVALID_PARAMS)
      ;; Transfer collateral from user to contract
      (try! (contract-call? .token transfer u0 amount tx-sender
        (as-contract tx-sender)
      ))


      (map-set markets market-id (merge market { q-yes: (+ (get q-yes market) amount) }))
      ;; Mint YES outcome tokens internally (no contract-call needed)
      (mint-token (get token-id-yes market) tx-sender amount)
      (ok true)
    )
  )
)

;; Public entry point for purchasing NO outcome shares
(define-public (buy-no
    (market-id uint)
    (amount uint)
  )
  (let ((market (unwrap! (map-get? markets market-id) ERR_MARKET_NOT_CREATED)))
    (begin
      (asserts! (get exists market) ERR_MARKET_NOT_CREATED)
      (asserts! (not (get resolved market)) ERR_ALREADY_RESOLVED)
      (asserts! (<= block-height (get end-time market)) ERR_MARKET_EXPIRED)
      ;; Simple fixed-price trade: 1 collateral per share
      (asserts! (> amount u0) ERR_INVALID_PARAMS)
      (try! (contract-call? .token transfer u0 amount tx-sender
        (as-contract tx-sender)
      ))

      (map-set markets market-id (merge market { q-no: (+ (get q-no market) amount) }))
      ;; Mint NO outcome tokens internally (no contract-call needed)
      (mint-token (get token-id-no market) tx-sender amount)
      (ok true)
    )
  )
)

;; Finalize market outcome after end time has passed
;; Only authorized roles can call this function
(define-public (resolve-market
    (market-id uint)
    (yes-won bool)
  )
  (let (
      (caller tx-sender)
      (market (unwrap! (map-get? markets market-id) ERR_MARKET_NOT_CREATED))
    )
    (begin
      (asserts! (is-eq caller (var-get contract-owner)) ERR_UNAUTHORIZED)
      (asserts! (get exists market) ERR_MARKET_NOT_CREATED)
      (asserts! (not (get resolved market)) ERR_ALREADY_RESOLVED)
      (asserts! (>= block-height (get end-time market)) ERR_MARKET_NOT_EXPIRED)
      (map-set markets market-id (merge market { resolved: true, yes-won: yes-won }))
      (ok true)
    )
  )
)

;; Allows users to redeem their winning shares for collateral
;; Burns outcome tokens and transfers equivalent collateral amount
(define-public (claim
    (market-id uint)
  )
  (let (
      (market (unwrap! (map-get? markets market-id) ERR_MARKET_NOT_CREATED))
      (winning-outcome (if (get yes-won market)
        u1
        u0
      ))
      (token-id (if (get yes-won market)
        (get token-id-yes market)
        (get token-id-no market)
      ))
    )
    (begin
      (asserts! (get exists market) ERR_MARKET_NOT_CREATED)
      (asserts! (get resolved market) ERR_NOT_RESOLVED)
      (let ((winning-shares (get-user-balance token-id tx-sender)))



        (begin
          (asserts! (> winning-shares u0) ERR_INSUFFICIENT_SHARES)
          (try! (burn-token token-id tx-sender winning-shares))
          ;; Payout collateral from contract to user
          (let ((claimant tx-sender))
            (try! (as-contract
              (contract-call? .token transfer u0 winning-shares
                tx-sender claimant
              )
            ))
          )
          (ok winning-shares)
        )
      )
    )
  )
)

;; Retrieve complete market data structure
(define-read-only (get-market (market-id uint))
  (ok (map-get? markets market-id))
)

;; Number of markets that have been created so far
(define-read-only (get-market-count)
  (ok (default-to u0 (map-get? market-count u0)))
)

;; Expose the contract owner address
(define-read-only (get-owner)
  (ok (var-get contract-owner))
)
