;; Implements the Logarithmic Market Scoring Rule (LMSR) for automated liquidity.
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
(define-constant ERR_BLACKLISTED (err u2012))
(define-constant ERR_NOT_WHITELISTED (err u2013))
(define-constant ERR_GEO_RESTRICTED (err u2014))
(define-constant ERR_DURATION_EXCEEDED (err u2015))
(define-constant ERR_RESOLUTION_TOO_EARLY (err u2016))
(define-constant ERR_MARKET_PAUSED (err u2017))
(define-constant ERR_INSUFFICIENT_LIQUIDITY (err u2018))

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

;; Security & Compliance Maps
(define-map blacklist
  principal
  bool
)
(define-map whitelist
  principal
  bool
)
(define-map kyc-verified
  principal
  bool
)
(define-map geo-restricted
  (string-ascii 2)
  bool
)

;; Market pause state
(define-map market-paused
  uint
  bool
)

;; Liquidity provider shares
(define-map lp-shares
  { market-id: uint, provider: principal }
  uint
)

;; Total LP shares per market
(define-map total-lp-shares
  uint
  uint
)

;; Market fee earnings for LP distribution
(define-map market-fee-pool
  uint
  uint
)

(define-data-var contract-owner principal 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
(define-data-var collateral-token principal 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
(define-data-var whitelist-enabled bool false)
(define-data-var kyc-required bool false)
(define-data-var max-market-duration uint u52560) ;; ~1 year in blocks
(define-data-var min-resolution-delay uint u144) ;; ~1 day in blocks
(define-data-var trading-fee-rate uint u10000) ;; 1% = 10000 (basis points, scaled by 1e6)
(define-data-var protocol-fee-collected uint u0)
(define-data-var emergency-pause bool false)

;; Role checks and configuration
(define-read-only (is-authorized (caller principal))
  (ok (or (default-to false (map-get? admin-role caller)) (default-to false (map-get? moderator-role caller))))
)

;; Security & Compliance Checks
;; Validates user compliance with blacklist, whitelist, KYC, and geographic restrictions
;; Returns ok(true) if compliant, otherwise returns appropriate error
(define-private (check-user-compliance (user principal) (country-code (string-ascii 2)))
  (begin
    ;; Check blacklist
    (asserts! (not (default-to false (map-get? blacklist user))) ERR_BLACKLISTED)
    ;; Check whitelist if enabled
    (asserts! (or (not (var-get whitelist-enabled)) 
                  (default-to false (map-get? whitelist user))) 
              ERR_NOT_WHITELISTED)
    ;; Check KYC if required
    (asserts! (or (not (var-get kyc-required))
                  (default-to false (map-get? kyc-verified user)))
              ERR_NOT_WHITELISTED)
    ;; Check geographic restrictions
    (asserts! (not (default-to false (map-get? geo-restricted country-code))) 
              ERR_GEO_RESTRICTED)
    (ok true)
  )
)

;; Public read-only function to check if a user meets compliance requirements
(define-read-only (is-user-compliant (user principal) (country-code (string-ascii 2)))
  (check-user-compliance user country-code)
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

;; Security & Compliance Management Functions
;; Owner-only functions to manage compliance settings

;; Add or remove a user from the blacklist
(define-public (set-blacklist
    (user principal)
    (blacklisted bool)
  )
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (map-set blacklist user blacklisted)
    (ok true)
  )
)

(define-public (set-whitelist
    (user principal)
    (whitelisted bool)
  )
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (map-set whitelist user whitelisted)
    (ok true)
  )
)

(define-public (set-kyc-verified
    (user principal)
    (verified bool)
  )
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (map-set kyc-verified user verified)
    (ok true)
  )
)

(define-public (set-geo-restriction
    (country-code (string-ascii 2))
    (restricted bool)
  )
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (map-set geo-restricted country-code restricted)
    (ok true)
  )
)

(define-public (set-whitelist-enabled (enabled bool))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (var-set whitelist-enabled enabled)
    (ok true)
  )
)

(define-public (set-kyc-required (required bool))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (var-set kyc-required required)
    (ok true)
  )
)

(define-public (set-max-market-duration (duration uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (var-set max-market-duration duration)
    (ok true)
  )
)

(define-public (set-min-resolution-delay (delay uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (var-set min-resolution-delay delay)
    (ok true)
  )
)

;; Fee and pause management
(define-public (set-trading-fee-rate (rate uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (var-set trading-fee-rate rate)
    (ok true)
  )
)

(define-public (set-emergency-pause (paused bool))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (var-set emergency-pause paused)
    (ok true)
  )
)

(define-public (set-market-pause (market-id uint) (paused bool))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (map-set market-paused market-id paused)
    (ok true)
  )
)

(define-public (withdraw-protocol-fees (amount uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (asserts! (<= amount (var-get protocol-fee-collected)) ERR_INSUFFICIENT_BALANCE)
    (var-set protocol-fee-collected (- (var-get protocol-fee-collected) amount))
    (as-contract (contract-call? .token transfer u0 amount tx-sender (var-get contract-owner)))
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
;; LMSR Math Helper Functions
;; ============================================================================

;; Approximates e^x using Taylor series expansion
;; Input: x in fixed-point (scaled by 1e6)
;; Output: e^x in fixed-point (scaled by 1e6)
(define-private (exp-approx (x int))
  (let (
      ;; Clamp x to prevent overflow
      (x-clamped (if (> x 20000000) 20000000 (if (< x -20000000) -20000000 x)))
      ;; Taylor series: e^x ≈ 1 + x + x²/2! + x³/3! + x⁴/4! + x⁵/5!
      (x2 (/ (* x-clamped x-clamped) 1000000))
      (x3 (/ (* x2 x-clamped) 1000000))
      (x4 (/ (* x3 x-clamped) 1000000))
      (x5 (/ (* x4 x-clamped) 1000000))
    )
    (+ 1000000
      x-clamped
      (/ x2 2)
      (/ x3 6)
      (/ x4 24)
      (/ x5 120)
    )
  )
)

;; Calculates LMSR cost function: C(q) = b * ln(e^(q_yes/b) + e^(q_no/b))
;; Returns cost in collateral tokens (scaled by 1e6)
(define-private (calculate-cost (b uint) (q-yes uint) (q-no uint))
  (let (
      (b-int (to-int b))
      (q-yes-int (to-int q-yes))
      (q-no-int (to-int q-no))
      ;; Calculate q/b ratios (scaled by 1e6)
      (ratio-yes (if (> b u0) (/ (* q-yes-int 1000000) b-int) 0))
      (ratio-no (if (> b u0) (/ (* q-no-int 1000000) b-int) 0))
      ;; Calculate e^(q/b)
      (exp-yes (exp-approx ratio-yes))
      (exp-no (exp-approx ratio-no))
      ;; Sum of exponentials
      (sum-exp (+ exp-yes exp-no))
    )
    ;; Approximate ln(sum) using log properties
    ;; For simplicity: ln(sum) ≈ max(ratio-yes, ratio-no) + ln(1 + e^(-|diff|))
    (let (
        (max-ratio (if (> ratio-yes ratio-no) ratio-yes ratio-no))
        (diff (if (> ratio-yes ratio-no) (- ratio-yes ratio-no) (- ratio-no ratio-yes)))
        ;; ln(1 + e^(-diff)) ≈ e^(-diff) for large diff, otherwise use approximation
        (ln-correction (if (> diff 5000000) 
          (/ 1000000 (exp-approx diff))
          (/ (exp-approx (- 0 diff)) 2)
        ))
      )
      ;; C = b * (max-ratio + ln-correction)
      (to-uint (/ (* b-int (+ max-ratio ln-correction)) 1000000))
    )
  )
)

;; Calculates the cost to buy a specific amount of shares
;; Returns the collateral amount needed
(define-read-only (get-buy-cost 
    (market-id uint)
    (outcome uint)
    (shares uint)
  )
  (let ((market (unwrap! (map-get? markets market-id) ERR_MARKET_NOT_CREATED)))
    (let (
        (b (get b market))
        (current-yes (get q-yes market))
        (current-no (get q-no market))
        (new-yes (if (is-eq outcome u1) (+ current-yes shares) current-yes))
        (new-no (if (is-eq outcome u0) (+ current-no shares) current-no))
        (cost-before (calculate-cost b current-yes current-no))
        (cost-after (calculate-cost b new-yes new-no))
      )
      (ok (if (>= cost-after cost-before) 
        (- cost-after cost-before)
        u0
      ))
    )
  )
)

;; Calculates the payout from selling shares
;; Returns the collateral amount received
(define-read-only (get-sell-payout
    (market-id uint)
    (outcome uint)
    (shares uint)
  )
  (let ((market (unwrap! (map-get? markets market-id) ERR_MARKET_NOT_CREATED)))
    (let (
        (b (get b market))
        (current-yes (get q-yes market))
        (current-no (get q-no market))
      )
      (asserts! (if (is-eq outcome u1) 
        (>= current-yes shares)
        (>= current-no shares)
      ) ERR_INSUFFICIENT_SHARES)
      (let (
          (new-yes (if (is-eq outcome u1) (- current-yes shares) current-yes))
          (new-no (if (is-eq outcome u0) (- current-no shares) current-no))
          (cost-before (calculate-cost b current-yes current-no))
          (cost-after (calculate-cost b new-yes new-no))
        )
        (ok (if (>= cost-before cost-after)
          (- cost-before cost-after)
          u0
        ))
      )
    )
  )
)

;; Calculates current market price for an outcome (0 to 1, scaled by 1e6)
;; Price = e^(q_outcome/b) / (e^(q_yes/b) + e^(q_no/b))
(define-read-only (get-price
    (market-id uint)
    (outcome uint)
  )
  (let ((market (unwrap! (map-get? markets market-id) ERR_MARKET_NOT_CREATED)))
    (let (
        (b-int (to-int (get b market)))
        (q-yes-int (to-int (get q-yes market)))
        (q-no-int (to-int (get q-no market)))
        (ratio-yes (if (> b-int 0) (/ (* q-yes-int 1000000) b-int) 0))
        (ratio-no (if (> b-int 0) (/ (* q-no-int 1000000) b-int) 0))
        (exp-yes (exp-approx ratio-yes))
        (exp-no (exp-approx ratio-no))
        (sum-exp (+ exp-yes exp-no))
      )
      (ok (if (is-eq outcome u1)
        (/ (* exp-yes 1000000) sum-exp)
        (/ (* exp-no 1000000) sum-exp)
      ))
    )
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
      ;; Check maximum market duration
      (asserts! (<= (- end-time start-time) (var-get max-market-duration)) ERR_DURATION_EXCEEDED)
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
    (shares uint)
    (country-code (string-ascii 2))
  )
  (let ((market (unwrap! (map-get? markets market-id) ERR_MARKET_NOT_CREATED)))
    (begin
      ;; Compliance checks
      (try! (check-user-compliance tx-sender country-code))
      
      (asserts! (get exists market) ERR_MARKET_NOT_CREATED)
      (asserts! (not (get resolved market)) ERR_ALREADY_RESOLVED)
      (asserts! (<= block-height (get end-time market)) ERR_MARKET_EXPIRED)
      (asserts! (> shares u0) ERR_INVALID_PARAMS)
      
      ;; Calculate dynamic cost using LMSR
      (let ((cost (unwrap! (get-buy-cost market-id u1 shares) ERR_INVALID_PARAMS)))
        (asserts! (> cost u0) ERR_INVALID_PARAMS)
        ;; Transfer collateral from buyer to contract
        (try! (contract-call? .token transfer u0 cost tx-sender (as-contract tx-sender)))
        ;; Update market state
        (map-set markets market-id (merge market { q-yes: (+ (get q-yes market) shares) }))
        ;; Mint outcome tokens
        (mint-token (get token-id-yes market) tx-sender shares)
        (ok cost)
      )
    )
  )
)

;; Public entry point for purchasing NO outcome shares
(define-public (buy-no
    (market-id uint)
    (shares uint)
    (country-code (string-ascii 2))
  )
  (let ((market (unwrap! (map-get? markets market-id) ERR_MARKET_NOT_CREATED)))
    (begin
      ;; Compliance checks
      (try! (check-user-compliance tx-sender country-code))
      
      (asserts! (get exists market) ERR_MARKET_NOT_CREATED)
      (asserts! (not (get resolved market)) ERR_ALREADY_RESOLVED)
      (asserts! (<= block-height (get end-time market)) ERR_MARKET_EXPIRED)
      (asserts! (> shares u0) ERR_INVALID_PARAMS)
      
      ;; Calculate dynamic cost using LMSR
      (let ((cost (unwrap! (get-buy-cost market-id u0 shares) ERR_INVALID_PARAMS)))
        (asserts! (> cost u0) ERR_INVALID_PARAMS)
        ;; Transfer collateral from buyer to contract
        (try! (contract-call? .token transfer u0 cost tx-sender (as-contract tx-sender)))
        ;; Update market state
        (map-set markets market-id (merge market { q-no: (+ (get q-no market) shares) }))
        ;; Mint outcome tokens
        (mint-token (get token-id-no market) tx-sender shares)
        (ok cost)
      )
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
      ;; Check minimum resolution delay
      (asserts! (>= block-height (+ (get end-time market) (var-get min-resolution-delay))) 
                ERR_RESOLUTION_TOO_EARLY)
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
          (let ((claimant tx-sender))
            (try! (as-contract
              (contract-call? .token transfer u0 winning-shares tx-sender claimant)
            ))
          )
          (ok winning-shares)
        )
      )
    )
  )
)

;; Sell shares back to the market at current LMSR price
(define-public (sell-yes
    (market-id uint)
    (shares uint)
    (country-code (string-ascii 2))
  )
  (let ((market (unwrap! (map-get? markets market-id) ERR_MARKET_NOT_CREATED)))
    (begin
      ;; Compliance checks
      (try! (check-user-compliance tx-sender country-code))
      
      (asserts! (get exists market) ERR_MARKET_NOT_CREATED)
      (asserts! (not (get resolved market)) ERR_ALREADY_RESOLVED)
      (asserts! (<= block-height (get end-time market)) ERR_MARKET_EXPIRED)
      (asserts! (> shares u0) ERR_INVALID_PARAMS)
      
      ;; Check user has enough shares
      (let ((user-balance (get-user-balance (get token-id-yes market) tx-sender)))
        (asserts! (>= user-balance shares) ERR_INSUFFICIENT_SHARES)
        
        ;; Calculate payout using LMSR
        (let ((payout (unwrap! (get-sell-payout market-id u1 shares) ERR_INVALID_PARAMS)))
          (asserts! (> payout u0) ERR_INVALID_PARAMS)
          ;; Burn outcome tokens
          (try! (burn-token (get token-id-yes market) tx-sender shares))
          ;; Update market state
          (map-set markets market-id (merge market { q-yes: (- (get q-yes market) shares) }))
          ;; Transfer collateral to seller
          (let ((seller tx-sender))
            (try! (as-contract
              (contract-call? .token transfer u0 payout tx-sender seller)
            ))
          )
          (ok payout)
        )
      )
    )
  )
)

(define-public (sell-no
    (market-id uint)
    (shares uint)
    (country-code (string-ascii 2))
  )
  (let ((market (unwrap! (map-get? markets market-id) ERR_MARKET_NOT_CREATED)))
    (begin
      ;; Compliance checks
      (try! (check-user-compliance tx-sender country-code))
      
      (asserts! (get exists market) ERR_MARKET_NOT_CREATED)
      (asserts! (not (get resolved market)) ERR_ALREADY_RESOLVED)
      (asserts! (<= block-height (get end-time market)) ERR_MARKET_EXPIRED)
      (asserts! (> shares u0) ERR_INVALID_PARAMS)
      
      ;; Check user has enough shares
      (let ((user-balance (get-user-balance (get token-id-no market) tx-sender)))
        (asserts! (>= user-balance shares) ERR_INSUFFICIENT_SHARES)
        
        ;; Calculate payout using LMSR
        (let ((payout (unwrap! (get-sell-payout market-id u0 shares) ERR_INVALID_PARAMS)))
          (asserts! (> payout u0) ERR_INVALID_PARAMS)
          ;; Burn outcome tokens
          (try! (burn-token (get token-id-no market) tx-sender shares))
          ;; Update market state
          (map-set markets market-id (merge market { q-no: (- (get q-no market) shares) }))
          ;; Transfer collateral to seller
          (let ((seller tx-sender))
            (try! (as-contract
              (contract-call? .token transfer u0 payout tx-sender seller)
            ))
          )
          (ok payout)
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
