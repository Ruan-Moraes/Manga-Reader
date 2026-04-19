package com.mangareader.presentation.subscription.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.subscription.usecase.CreateGiftCodeUseCase;
import com.mangareader.application.subscription.usecase.CreateSubscriptionUseCase;
import com.mangareader.application.subscription.usecase.GetMySubscriptionHistoryUseCase;
import com.mangareader.application.subscription.usecase.GetMySubscriptionUseCase;
import com.mangareader.application.subscription.usecase.GetSubscriptionPlansUseCase;
import com.mangareader.application.subscription.usecase.RedeemGiftCodeUseCase;
import com.mangareader.presentation.subscription.dto.CreateGiftCodeRequest;
import com.mangareader.presentation.subscription.dto.CreateSubscriptionRequest;
import com.mangareader.presentation.subscription.dto.GiftCodeResponse;
import com.mangareader.presentation.subscription.dto.RedeemGiftCodeRequest;
import com.mangareader.presentation.subscription.dto.SubscriptionPlanResponse;
import com.mangareader.presentation.subscription.dto.SubscriptionResponse;
import com.mangareader.presentation.subscription.mapper.SubscriptionMapper;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Endpoints REST para planos de assinatura, compra e gift codes.
 */
@RestController
@RequiredArgsConstructor
public class SubscriptionController {

    private final GetSubscriptionPlansUseCase getPlansUseCase;
    private final CreateSubscriptionUseCase createSubscriptionUseCase;
    private final CreateGiftCodeUseCase createGiftCodeUseCase;
    private final RedeemGiftCodeUseCase redeemGiftCodeUseCase;
    private final GetMySubscriptionUseCase getMySubscriptionUseCase;
    private final GetMySubscriptionHistoryUseCase getMySubscriptionHistoryUseCase;

    /** Lista todos os planos ativos — público, sem autenticação. */
    @GetMapping("/api/subscription-plans")
    public ResponseEntity<ApiResponse<List<SubscriptionPlanResponse>>> getPlans() {
        List<SubscriptionPlanResponse> plans = getPlansUseCase.execute()
                .stream()
                .map(SubscriptionMapper::toPlanResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(plans));
    }

    /** Assina um plano — requer autenticação. */
    @PostMapping("/api/subscriptions")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> subscribe(
            @Valid @RequestBody CreateSubscriptionRequest request,
            Authentication auth
    ) {
        UUID userId = extractUserId(auth);
        var subscription = createSubscriptionUseCase.execute(userId, request.planId());
        return ResponseEntity.status(201).body(ApiResponse.created(SubscriptionMapper.toSubscriptionResponse(subscription)));
    }

    /** Cria um gift code para presentear alguém — requer autenticação. */
    @PostMapping("/api/subscriptions/gift")
    public ResponseEntity<ApiResponse<GiftCodeResponse>> createGift(
            @Valid @RequestBody CreateGiftCodeRequest request,
            Authentication auth
    ) {
        UUID userId = extractUserId(auth);
        var giftCode = createGiftCodeUseCase.execute(userId, request.planId(), request.recipientEmail());
        return ResponseEntity.status(201).body(ApiResponse.created(SubscriptionMapper.toGiftCodeResponse(giftCode)));
    }

    /** Resgata um gift code — requer autenticação. */
    @PostMapping("/api/subscriptions/redeem")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> redeem(
            @Valid @RequestBody RedeemGiftCodeRequest request,
            Authentication auth
    ) {
        UUID userId = extractUserId(auth);
        var subscription = redeemGiftCodeUseCase.execute(userId, request.code());
        return ResponseEntity.status(201).body(ApiResponse.created(SubscriptionMapper.toSubscriptionResponse(subscription)));
    }

    /** Retorna a assinatura ativa do usuário autenticado. */
    @GetMapping("/api/subscriptions/me")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> getMySubscription(Authentication auth) {
        UUID userId = extractUserId(auth);
        return getMySubscriptionUseCase.execute(userId)
                .map(sub -> ResponseEntity.ok(ApiResponse.success(SubscriptionMapper.toSubscriptionResponse(sub))))
                .orElseGet(() -> ResponseEntity.ok(ApiResponse.success(null)));
    }

    /** Retorna o histórico de assinaturas do usuário autenticado. */
    @GetMapping("/api/subscriptions/me/history")
    public ResponseEntity<ApiResponse<PageResponse<SubscriptionResponse>>> getMySubscriptionHistory(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        UUID userId = extractUserId(auth);
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        var result = getMySubscriptionHistoryUseCase.execute(userId, pageable);
        var mapped = result.map(SubscriptionMapper::toSubscriptionResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    private UUID extractUserId(Authentication auth) {
        return (UUID) auth.getPrincipal();
    }
}
