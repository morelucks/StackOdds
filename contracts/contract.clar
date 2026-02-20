;; Prediction market using LMSR pricing mechanism
;; Allows users to trade shares on binary outcomes with automatic price discovery

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

;; Traits
(define-trait sip-010-trait
  (
    (transfer (uint principal principal (optional (buff 34))) (response bool uint))
    (get-name () (response (string-ascii 32) uint))
    (get-symbol () (response (string-ascii 10) uint))
    (get-decimals () (response uint uint))
    (get-balance (principal) (response uint uint))
    (get-total-supply () (response uint uint))
    (get-token-uri () (response (optional (string-utf8 256)) uint))
  )
)

(define-trait outcome-trait
  (
    (initialize-token (uint uint uint (string-ascii 32) (string-ascii 32) (string-ascii 10) (string-ascii 10)) (response bool uint))
    (mint (uint principal uint) (response bool uint))
    (burn (uint principal uint) (response bool uint))
    (get-balance (uint principal) (response uint uint))
  )
)

;; Precision constants for decimal handling
;; PRECISION represents 1.0 in fixed-point math (6 decimals)
;; PRECISION_18 is used for internal calculations (18 decimals)
(define-constant PRECISION u1000000)
(define-constant PRECISION_18 u1000000000000000000)

;; Stores all market data including quantities, timing, and resolution status
(define-map markets uint
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
        token-id-no: uint
    }
)

(define-map market-count uint uint)
(define-map admin-role principal bool)
(define-map moderator-role principal bool)

(define-data-var contract-owner principal 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
(define-data-var collateral-token principal 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
(define-data-var outcome-token-contract principal 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)

;; Setup function to configure owner, collateral token, and outcome token contract addresses
(define-public (initialize (owner principal) (collateral principal) (outcome-token principal))
    (begin
        (var-set contract-owner owner)
        (var-set collateral-token collateral)
        (var-set outcome-token-contract outcome-token)
        (map-set admin-role owner true)
        (map-set moderator-role owner true)
        (ok true)
    )
)

;; Role-based permission checking and management
(define-read-only (is-authorized (caller principal))
    (ok (or (default-to false (map-get? admin-role caller)) (default-to false (map-get? moderator-role caller))))
)

(define-public (set-admin-role (principal principal) (enabled bool))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
        (map-set admin-role principal enabled)
        (ok true)
    )
)

(define-public (set-moderator-role (principal principal) (enabled bool))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
        (map-set moderator-role principal enabled)
        (ok true)
    )
)

;; Mathematical approximations for LMSR calculations
;; Uses polynomial expansion to estimate exponential values
;; Accuracy is sufficient for small input ranges typical in market operations
(define-read-only (exp-approx (x uint))
    (let
        (
            (x-scaled (/ x u1000))
            (x2 (/ (* x-scaled x-scaled) u1000))
            (x3 (/ (* x2 x-scaled) u1000))
            (x4 (/ (* x3 x-scaled) u1000))
        )
        (+ u1000000 (+ x-scaled (+ (/ x2 u2) (+ (/ x3 u6) (/ x4 u24)))))
    )
)

;; Logarithm estimation using series expansion
;; Optimized for values near 1.0 which is common in our pricing calculations
(define-read-only (ln-approx (x uint))
    (if (<= x u1000000)
        u0
        (let
            (
                (x-minus-1 (- x u1000000))
                (x-plus-1 (+ x u1000000))
                (ratio (/ (* x-minus-1 u1000000) x-plus-1))
                (ratio3 (/ (* ratio ratio ratio) (* u1000000 u1000000)))
            )
            (/ (* (+ (* ratio u2) (/ ratio3 u3)) u1000000) u1000000)
        )
    )
)

;; Computes the total cost function value for current market state
;; This represents the total collateral locked in the market
;; Computes the total cost function value for current market state
;; This represents the total collateral locked in the market
(define-read-only (calculate-cost (b uint) (q-yes uint) (q-no uint))
    (let
        (
            (exp-yes (exp-approx (/ q-yes b)))
            (exp-no (exp-approx (/ q-no b)))
            (sum-exp (+ exp-yes exp-no))
            (ln-sum (ln-approx sum-exp))
        )
        (/ (* b ln-sum) u1000000)
    )
)

;; Determines the current price per YES share based on current quantities
;; Price increases as more YES shares are purchased
(define-read-only (calculate-price-yes (b uint) (q-yes uint) (q-no uint))
    (let
        (
            (exp-yes (exp-approx (/ q-yes b)))
            (exp-no (exp-approx (/ q-no b)))
            (sum-exp (+ exp-yes exp-no))
        )
        (/ (* exp-yes u1000000) sum-exp)
    )
)

;; Determines the current price per NO share based on current quantities
;; Price increases as more NO shares are purchased
(define-read-only (calculate-price-no (b uint) (q-yes uint) (q-no uint))
    (let
        (
            (exp-yes (exp-approx (/ q-yes b)))
            (exp-no (exp-approx (/ q-no b)))
            (sum-exp (+ exp-yes exp-no))
        )
        (/ (* exp-no u1000000) sum-exp)
    )
)

;; Public view function to query the total cost value for a specific market
(define-read-only (cost (market-id uint))
    (let
        (
            (market (unwrap! (map-get? markets market-id) ERR_MARKET_NOT_CREATED))
        )
        (ok (calculate-cost (get b market) (get q-yes market) (get q-no market)))
    )
)

;; Public view function to check current YES share price
(define-read-only (price-yes (market-id uint))
    (let
        (
            (market (unwrap! (map-get? markets market-id) ERR_MARKET_NOT_CREATED))
        )
        (ok (calculate-price-yes (get b market) (get q-yes market) (get q-no market)))
    )
)

;; Public view function to check current NO share price
(define-read-only (price-no (market-id uint))
    (let
        (
            (market (unwrap! (map-get? markets market-id) ERR_MARKET_NOT_CREATED))
        )
        (ok (calculate-price-no (get b market) (get q-yes market) (get q-no market)))
    )
)

;; Establishes a new prediction market with specified parameters
;; Requires initial liquidity deposit from the creator
(define-public (create-market (b uint) (start-time uint) (end-time uint) (question (string-ascii 256)) (c-id (string-ascii 64)) (collateral-trait <sip-010-trait>) (outcome-contract <outcome-trait>))
    (let
        (
            (caller tx-sender)
            (is-auth (unwrap-panic (is-authorized caller)))
        )
        (begin
            (asserts! is-auth ERR_UNAUTHORIZED)
            (asserts! (> b u0) ERR_ZERO_LIQUIDITY)
            (asserts! (> end-time start-time) ERR_INVALID_PARAMS)
            (asserts! (>= start-time block-height) ERR_INVALID_PARAMS)
            (asserts! (is-eq (contract-of collateral-trait) (var-get collateral-token)) ERR_INVALID_PARAMS)
            (asserts! (is-eq (contract-of outcome-contract) (var-get outcome-token-contract)) ERR_INVALID_PARAMS)
            (let
                (
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
                    ;; Collect the initial liquidity deposit
                    (try! (contract-call? collateral-trait transfer fund-amount caller (as-contract tx-sender) none))
                    ;; Set up YES and NO token identifiers for this market
                    (let
                        (
                            (token-id-yes (+ (* market-id u2) u1))
                            (token-id-no (* market-id u2))
                            (name-yes "Market YES")
                            (name-no "Market NO")
                        )
                        (begin
                            (try! (contract-call? outcome-contract initialize-token market-id token-id-yes token-id-no name-yes name-no "YES" "NO"))
                            (map-set markets market-id
                                {
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
                                    token-id-no: token-id-no
                                }
                            )
                            (map-set market-count u0 market-id)
                            (ok market-id)
                        )
                    )
                )
            )
        )
    )
)

;; Core trading logic shared by both YES and NO purchase functions
;; Handles quantity updates, cost calculation, and token minting
(define-private (buy-shares (market-id uint) (amount uint) (yes bool) (collateral-trait <sip-010-trait>) (outcome-contract <outcome-trait>))
    (let
        (
            (market (unwrap! (map-get? markets market-id) ERR_MARKET_NOT_CREATED))
        )
        (begin
            (asserts! (get exists market) ERR_MARKET_NOT_CREATED)
            (asserts! (not (get resolved market)) ERR_ALREADY_RESOLVED)
            (asserts! (<= block-height (get end-time market)) ERR_MARKET_EXPIRED)
            (let
                (
                    (initial-cost (try! (cost market-id)))
                    (amount-internal (* amount u1000000000000))
                    (new-q-yes (if yes (+ (get q-yes market) amount-internal) (get q-yes market)))
                    (new-q-no (if yes (get q-no market) (+ (get q-no market) amount-internal)))
                    (new-cost (calculate-cost (get b market) new-q-yes new-q-no))
                    (collateral-required (/ (- new-cost initial-cost) u1000000000000))
                )
                (begin
                    (asserts! (> collateral-required u0) ERR_INVALID_PARAMS)
                    ;; Collect payment from trader
                    (try! (contract-call? collateral-trait transfer collateral-required tx-sender (as-contract tx-sender) none))
                    ;; Record the new share quantities
                    (map-set markets market-id
                        {
                            exists: true,
                            b: (get b market),
                            q-yes: new-q-yes,
                            q-no: new-q-no,
                            start-time: (get start-time market),
                            end-time: (get end-time market),
                            resolved: (get resolved market),
                            yes-won: (get yes-won market),
                            question: (get question market),
                            c-id: (get c-id market),
                            token-id-yes: (get token-id-yes market),
                            token-id-no: (get token-id-no market)
                        }
                    )
                    ;; Issue the purchased shares to the trader
                    (let
                        (
                            (token-id (if yes (get token-id-yes market) (get token-id-no market)))
                        )
                        (try! (contract-call? outcome-contract mint token-id tx-sender amount))
                    )
                    (ok true)
                )
            )
        )
    )
)

;; Public entry point for purchasing YES outcome shares
(define-public (buy-yes (market-id uint) (amount uint) (collateral-trait <sip-010-trait>) (outcome-contract <outcome-trait>))
    (begin
        (asserts! (is-eq (contract-of collateral-trait) (var-get collateral-token)) ERR_INVALID_PARAMS)
        (asserts! (is-eq (contract-of outcome-contract) (var-get outcome-token-contract)) ERR_INVALID_PARAMS)
        (buy-shares market-id amount true collateral-trait outcome-contract)
    )
)

;; Public entry point for purchasing NO outcome shares
(define-public (buy-no (market-id uint) (amount uint) (collateral-trait <sip-010-trait>) (outcome-contract <outcome-trait>))
    (begin
        (asserts! (is-eq (contract-of collateral-trait) (var-get collateral-token)) ERR_INVALID_PARAMS)
        (asserts! (is-eq (contract-of outcome-contract) (var-get outcome-token-contract)) ERR_INVALID_PARAMS)
        (buy-shares market-id amount false collateral-trait outcome-contract)
    )
)

;; Finalize market outcome after end time has passed
;; Only authorized roles can call this function
(define-public (resolve-market (market-id uint) (yes-won bool))
    (let
        (
            (caller tx-sender)
            (is-auth (unwrap-panic (is-authorized caller)))
            (market (unwrap! (map-get? markets market-id) ERR_MARKET_NOT_CREATED))
        )
        (begin
            (asserts! is-auth ERR_UNAUTHORIZED)
            (asserts! (get exists market) ERR_MARKET_NOT_CREATED)
            (asserts! (not (get resolved market)) ERR_ALREADY_RESOLVED)
            (asserts! (>= block-height (get end-time market)) ERR_MARKET_NOT_EXPIRED)
            (map-set markets market-id
                {
                    exists: true,
                    b: (get b market),
                    q-yes: (get q-yes market),
                    q-no: (get q-no market),
                    start-time: (get start-time market),
                    end-time: (get end-time market),
                    resolved: true,
                    yes-won: yes-won,
                    question: (get question market),
                    c-id: (get c-id market),
                    token-id-yes: (get token-id-yes market),
                    token-id-no: (get token-id-no market)
                }
            )
            (ok true)
        )
    )
)

;; Allows users to redeem their winning shares for collateral
;; Burns outcome tokens and transfers equivalent collateral amount
(define-public (claim (market-id uint) (collateral-trait <sip-010-trait>) (outcome-contract <outcome-trait>))
    (let
        (
            (market (unwrap! (map-get? markets market-id) ERR_MARKET_NOT_CREATED))
            (winning-outcome (if (get yes-won market) u1 u0))
            (token-id (if (get yes-won market) (get token-id-yes market) (get token-id-no market)))
        )
        (begin
            (asserts! (get exists market) ERR_MARKET_NOT_CREATED)
            (asserts! (get resolved market) ERR_NOT_RESOLVED)
            (asserts! (is-eq (contract-of collateral-trait) (var-get collateral-token)) ERR_INVALID_PARAMS)
            (asserts! (is-eq (contract-of outcome-contract) (var-get outcome-token-contract)) ERR_INVALID_PARAMS)
            (let
                (
                    (winning-shares (try! (contract-call? outcome-contract get-balance token-id tx-sender)))
                )
                (begin
                    (asserts! (> winning-shares u0) ERR_INSUFFICIENT_SHARES)
                    ;; Remove shares from user's balance
                    (try! (contract-call? outcome-contract burn token-id tx-sender winning-shares))
                    ;; Payout collateral at 1:1 exchange rate
                    (try! (contract-call? collateral-trait transfer winning-shares (as-contract tx-sender) tx-sender none))
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

;; Returns the total number of markets that have been created
(define-read-only (get-market-count)
    (ok (default-to u0 (map-get? market-count u0)))
)
