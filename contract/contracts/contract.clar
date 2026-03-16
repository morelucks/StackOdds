;; Predict-It: LMSR Prediction Market on Stacks
;; This contract allows users to create markets, trade shares (YES/NO) using the LMSR pricing model,
;; and claim winnings if their outcome is correct.

;; =====================================================================
;; Constants & Error Codes
;; =====================================================================
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
(define-constant ERR_INSUFFICIENT_FUNDS (err u2018))

;; Protocol configuration
(define-constant FEE_SCALE u1000000)
(define-constant MAX_MARKET_DURATION u10000)
(define-constant RESOLUTION_DELAY u5)

;; Fixed-point math precision
(define-constant PRECISION u1000000000000000000) ;; 18 decimals for internal math
(define-constant LN2 u693147180559945309) ;; ln(2) scaled to 18 decimals
(define-constant TO_6_DECIMALS u1000000000000) ;; Multiplier to go from 6 to 18
(define-constant FROM_6_DECIMALS u1000000) ;; Multiplier for 6-decimal UI inputs

;; =====================================================================
;; Data Variables and Maps
;; =====================================================================
(define-data-var contract-owner principal tx-sender)
(define-data-var collateral-token principal tx-sender)
(define-data-var market-count uint u0)
(define-data-var trading-fee-rate uint u0)
(define-data-var protocol-fees uint u0)
(define-data-var emergency-paused bool false)
(define-data-var whitelist-enabled bool false)

(define-map admin-role principal bool)
(define-map moderator-role principal bool)
(define-map market-paused uint bool)
(define-map blacklist principal bool)
(define-map whitelist principal bool)
(define-map geo-restricted (string-ascii 2) bool)

(define-map lp-shares { market-id: uint, owner: principal } uint)
(define-map total-lp-shares uint uint)

(define-map markets uint
    {
        exists: bool,
        b: uint,               ;; LMSR liquidity parameter (scaled to 18 decimals)
        q-yes: uint,           ;; YES token quantity (scaled to 18 decimals)
        q-no: uint,            ;; NO token quantity (scaled to 18 decimals)
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

;; =====================================================================
;; Admin & Setup Functions
;; =====================================================================
(define-public (initialize (owner principal) (collateral principal))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
        (var-set contract-owner owner)
        (var-set collateral-token collateral)
        (map-set admin-role owner true)
        (map-set moderator-role owner true)
        (ok true)
    )
)

(define-read-only (get-owner) (ok (var-get contract-owner)))

(define-read-only (is-authorized-caller (caller principal))
    (or 
        (is-eq caller (var-get contract-owner))
        (default-to false (map-get? admin-role caller)) 
        (default-to false (map-get? moderator-role caller))
    )
)

(define-read-only (is-authorized (caller principal))
    (ok (is-authorized-caller caller))
)

(define-public (set-admin-role (account principal) (enabled bool))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
        (map-set admin-role account enabled)
        (ok true)
    )
)

(define-public (set-moderator-role (account principal) (enabled bool))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
        (map-set moderator-role account enabled)
        (ok true)
    )
)

;; =====================================================================
;; Compliance & Pause Controls
;; =====================================================================
(define-public (set-emergency-pause (paused bool))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
        (var-set emergency-paused paused)
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

(define-public (set-blacklist (account principal) (enabled bool))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
        (map-set blacklist account enabled)
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

(define-public (set-whitelist (account principal) (enabled bool))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
        (map-set whitelist account enabled)
        (ok true)
    )
)

(define-public (set-geo-restriction (country (string-ascii 2)) (enabled bool))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
        (map-set geo-restricted country enabled)
        (ok true)
    )
)

(define-public (is-user-compliant (account principal) (country (string-ascii 2)))
    (begin
        (asserts! (not (default-to false (map-get? blacklist account))) ERR_BLACKLISTED)
        (asserts! (not (default-to false (map-get? geo-restricted country))) ERR_GEO_RESTRICTED)
        (asserts! (or (not (var-get whitelist-enabled)) (default-to false (map-get? whitelist account))) ERR_NOT_WHITELISTED)
        (ok true)
    )
)

;; =====================================================================
;; Math Helpers (LMSR Polynomial Expansion)
;; =====================================================================
(define-read-only (exp-approx (x uint))
    (let
        (
            (x1 (/ x u1000000000)) ;; Scale down for iteration
            (x2 (/ (* x1 x1) u1000000000))
            (x3 (/ (* x2 x1) u1000000000))
            (x4 (/ (* x3 x1) u1000000000))
        )
        (+ PRECISION (+ (* x1 u1000000000) (+ (/ (* x2 u1000000000) u2) (+ (/ (* x3 u1000000000) u6) (/ (* x4 u1000000000) u24)))))
    )
)

(define-read-only (ln-approx (x uint))
    (if (<= x PRECISION)
        u0
        (let
            (
                (x-minus-1 (- x PRECISION))
                (x-plus-1 (+ x PRECISION))
                (ratio (/ (* x-minus-1 PRECISION) x-plus-1))
                (ratio3 (/ (* ratio (* ratio ratio)) (* PRECISION PRECISION)))
            )
            (+ (* ratio u2) (/ (* ratio3 u2) u3))
        )
    )
)

(define-read-only (calculate-cost (b uint) (q-yes uint) (q-no uint))
    (let
        (
            (exp-yes (exp-approx (/ (* q-yes PRECISION) b)))
            (exp-no (exp-approx (/ (* q-no PRECISION) b)))
            (ln-sum (ln-approx (+ exp-yes exp-no)))
        )
        (/ (* b ln-sum) PRECISION)
    )
)

(define-read-only (calculate-price-yes (b uint) (q-yes uint) (q-no uint))
    (let
        (
            (exp-yes (exp-approx (/ (* q-yes PRECISION) b)))
            (exp-no (exp-approx (/ (* q-no PRECISION) b)))
            (sum-exp (+ exp-yes exp-no))
        )
        (/ (* exp-yes FEE_SCALE) sum-exp)
    )
)

(define-read-only (calculate-price-no (b uint) (q-yes uint) (q-no uint))
    (let
        (
            (exp-yes (exp-approx (/ (* q-yes PRECISION) b)))
            (exp-no (exp-approx (/ (* q-no PRECISION) b)))
            (sum-exp (+ exp-yes exp-no))
        )
        (/ (* exp-no FEE_SCALE) sum-exp)
    )
)

;; =====================================================================
;; Read-Only View Functions
;; =====================================================================
(define-read-only (get-market (id uint))
    (let ((m (map-get? markets id)))
        (if (is-some m) (ok (unwrap-panic m)) ERR_MARKET_NOT_CREATED)
    )
)

(define-read-only (get-market-summary (id uint))
    (let ((m (unwrap! (map-get? markets id) ERR_MARKET_NOT_CREATED)))
        (ok {
            exists: (get exists m),
            b: (get b m),
            q-yes: (get q-yes m),
            q-no: (get q-no m),
            price-yes: (calculate-price-yes (get b m) (get q-yes m) (get q-no m)),
            price-no: (calculate-price-no (get b m) (get q-yes m) (get q-no m)),
            resolved: (get resolved m),
            yes-won: (get yes-won m),
            question: (get question m),
            end-time: (get end-time m)
        })
    )
)

(define-read-only (get-market-count) (ok (var-get market-count)))

(define-read-only (get-price (market-id uint) (outcome uint))
    (let ((m (unwrap! (map-get? markets market-id) ERR_MARKET_NOT_CREATED)))
        (ok (if (is-eq outcome u1)
                (calculate-price-yes (get b m) (get q-yes m) (get q-no m))
                (calculate-price-no (get b m) (get q-yes m) (get q-no m))
            )
        )
    )
)

(define-read-only (get-buy-cost (market-id uint) (outcome uint) (amount uint))
    (let ((price (unwrap-panic (get-price market-id outcome))))
        (ok (/ (* price amount) FEE_SCALE))
    )
)

(define-read-only (get-sell-payout (market-id uint) (outcome uint) (amount uint))
    (let ((price (unwrap-panic (get-price market-id outcome))))
        (ok (/ (* price amount) FEE_SCALE))
    )
)

;; =====================================================================
;; Core Market Operations
;; =====================================================================

;; Establishes a new prediction market
(define-public (create-market (b uint) (start-time uint) (end-time uint) (question (string-ascii 256)) (c-id (string-ascii 64)))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
        (asserts! (> b u0) ERR_ZERO_LIQUIDITY)
        (asserts! (> end-time start-time) ERR_INVALID_PARAMS)
        (asserts! (>= start-time (block-height)) ERR_INVALID_PARAMS)
        (asserts! (<= (- end-time start-time) MAX_MARKET_DURATION) ERR_DURATION_EXCEEDED)

        (let
            (
                (market-id (+ (var-get market-count) u1))
                (token-id-yes (+ (* market-id u2) u1))
                (token-id-no (* market-id u2))
            )
            (map-set markets market-id
                {
                    exists: true,
                    b: b,
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
            (map-set token-metadata token-id-yes { name: "Market YES", symbol: "YES", decimals: u6 })
            (map-set token-metadata token-id-no { name: "Market NO", symbol: "NO", decimals: u6 })
            (map-set total-supply-map token-id-yes u0)
            (map-set total-supply-map token-id-no u0)
            (map-set market-paused market-id false)
            (var-set market-count market-id)
            (print {event: "market-created", market-id: market-id, question: question, end-time: end-time, liquidity: b})
            (ok market-id)
        )
    )
)

;; Private helper for buying shares updates quantities and applies LMSR pricing
(define-private (buy-shares (market-id uint) (amount uint) (is-yes bool) (collateral-trait <sip-010-trait>) (outcome-contract <outcome-trait>))
    (let
        (
            (market (unwrap! (map-get? markets market-id) ERR_MARKET_NOT_CREATED))
            (initial-cost (calculate-cost (get b market) (get q-yes market) (get q-no market)))
            (amount-internal (* amount SCALING_FACTOR))
            (new-q-yes (if is-yes (+ (get q-yes market) amount-internal) (get q-yes market)))
            (new-q-no (if is-yes (get q-no market) (+ (get q-no market) amount-internal)))
            (new-cost (calculate-cost (get b market) new-q-yes new-q-no))
            (collateral-required (/ (- new-cost initial-cost) SCALING_FACTOR))
            (token-id (if is-yes (get token-id-yes market) (get token-id-no market)))
        )
        (asserts! (not (get resolved market)) ERR_ALREADY_RESOLVED)
        (asserts! (> collateral-required u0) ERR_INVALID_PARAMS)
        
        ;; Collect Payment
        (try! (contract-call? collateral-trait transfer collateral-required tx-sender (as-contract tx-sender) none))
        
        ;; Update Market Quantities
        (map-set markets market-id (merge market { q-yes: new-q-yes, q-no: new-q-no }))
        
        ;; Issue Shares
        (try! (contract-call? outcome-contract mint token-id tx-sender amount))
        
        (print {event: "shares-bought", market-id: market-id, buyer: tx-sender, is-yes: is-yes, amount: amount, cost: collateral-required})
        (ok collateral-required)
    )
)

(define-public (buy-yes (market-id uint) (amount uint) (collateral-trait <sip-010-trait>) (outcome-contract <outcome-trait>))
    (begin
        (try! (validate-traits collateral-trait outcome-contract))
        (buy-shares market-id amount true collateral-trait outcome-contract)
    )
)

(define-public (buy-no (market-id uint) (amount uint) (collateral-trait <sip-010-trait>) (outcome-contract <outcome-trait>))
    (begin
        (try! (validate-traits collateral-trait outcome-contract))
        (buy-shares market-id amount false collateral-trait outcome-contract)
    )
)

;; Resolves the market assigning the winning outcome
(define-public (resolve-market (market-id uint) (yes-won bool))
    (let
        (
            (market (unwrap! (map-get? markets market-id) ERR_MARKET_NOT_CREATED))
        )
        (asserts! (is-authorized-caller tx-sender) ERR_UNAUTHORIZED)
        (asserts! (not (get resolved market)) ERR_ALREADY_RESOLVED)
        
        (map-set markets market-id (merge market { resolved: true, yes-won: yes-won }))
        
        (print {event: "market-resolved", market-id: market-id, yes-won: yes-won})
        (ok true)
    )
)

;; Allows users to redeem their winning shares for collateral at 1:1 ratio
(define-public (claim (market-id uint) (collateral-trait <sip-010-trait>) (outcome-contract <outcome-trait>))
    (let
        (
            (market (unwrap! (map-get? markets market-id) ERR_MARKET_NOT_CREATED))
            (token-id (if (get yes-won market) (get token-id-yes market) (get token-id-no market)))
            (winning-shares (try! (contract-call? outcome-contract get-balance token-id tx-sender)))
        )
        (try! (validate-traits collateral-trait outcome-contract))
        (asserts! (get resolved market) ERR_NOT_RESOLVED)
        (asserts! (> winning-shares u0) ERR_INSUFFICIENT_SHARES)
        
        ;; Burn shares
        (try! (contract-call? outcome-contract burn token-id tx-sender winning-shares))
        
        ;; Payout collateral
        (try! (contract-call? collateral-trait transfer winning-shares (as-contract tx-sender) tx-sender none))
        
        (print {event: "winnings-claimed", market-id: market-id, user: tx-sender, amount: winning-shares})
        (ok winning-shares)
    )
)
