package com.mangareader.presentation.subscription.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
import com.mangareader.shared.web.CurrentUserId;
import com.mangareader.shared.web.PageParams;

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
    private final SubscriptionMapper subscriptionMapper;

    /** Lista todos os planos ativos — público, sem autenticação. */
    @GetMapping("/api/subscription-plans")
    public ResponseEntity<ApiResponse<List<SubscriptionPlanResponse>>> getPlans() {
        List<SubscriptionPlanResponse> plans = getPlansUseCase.execute()
                .stream()
                .map(subscriptionMapper::toPlanResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(plans));
    }

    /** Assina um plano — requer autenticação. */
    @PostMapping("/api/subscriptions")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> subscribe(
            @Valid @RequestBody CreateSubscriptionRequest request,
            @CurrentUserId UUID userId
    ) {
        var subscription = createSubscriptionUseCase.execute(userId, request.planId());
        return ResponseEntity.status(201).body(ApiResponse.created(subscriptionMapper.toSubscriptionResponse(subscription)));
    }

    /** Cria um gift code para presentear alguém — requer autenticação. */
    @PostMapping("/api/subscriptions/gift")
    public ResponseEntity<ApiResponse<GiftCodeResponse>> createGift(
            @Valid @RequestBody CreateGiftCodeRequest request,
            @CurrentUserId UUID userId
    ) {
        var giftCode = createGiftCodeUseCase.execute(userId, request.planId(), request.recipientEmail());
        return ResponseEntity.status(201).body(ApiResponse.created(subscriptionMapper.toGiftCodeResponse(giftCode)));
    }

    /** Resgata um gift code — requer autenticação. */
    @PostMapping("/api/subscriptions/redeem")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> redeem(
            @Valid @RequestBody RedeemGiftCodeRequest request,
            @CurrentUserId UUID userId
    ) {
        var subscription = redeemGiftCodeUseCase.execute(userId, request.code());
        return ResponseEntity.status(201).body(ApiResponse.created(subscriptionMapper.toSubscriptionResponse(subscription)));
    }

    /** Retorna a assinatura ativa do usuário autenticado. */
    @GetMapping("/api/subscriptions/me")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> getMySubscription(
            @CurrentUserId UUID userId
    ) {
        return getMySubscriptionUseCase.execute(userId)
                .map(sub -> ResponseEntity.ok(ApiResponse.success(subscriptionMapper.toSubscriptionResponse(sub))))
                .orElseGet(() -> ResponseEntity.ok(ApiResponse.success(null)));
    }

    /** Retorna o histórico de assinaturas do usuário autenticado. */
    @GetMapping("/api/subscriptions/me/history")
    public ResponseEntity<ApiResponse<PageResponse<SubscriptionResponse>>> getMySubscriptionHistory(
            @CurrentUserId UUID userId,
            @PageParams(defaultSort = "createdAt", defaultDirection = "desc",
                    ignoreRequestSort = true)
            Pageable pageable
    ) {
        var result = getMySubscriptionHistoryUseCase.execute(userId, pageable);
        var mapped = result.map(subscriptionMapper::toSubscriptionResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }
}
