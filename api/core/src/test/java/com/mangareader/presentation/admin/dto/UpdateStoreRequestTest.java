package com.mangareader.presentation.admin.dto;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import jakarta.validation.Validation;

class UpdateStoreRequestTest {
    @Test
    void rejectsBlankWebsiteButAllowsItToBeOmittedFromPatch() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();

            assertThat(validator.validate(new UpdateStoreRequest(
                    null, "   ", null, null, null, null)))
                    .extracting(violation -> violation.getPropertyPath().toString())
                    .contains("website");
            assertThat(validator.validate(new UpdateStoreRequest(
                    null, null, null, null, null, null))).isEmpty();
        }
    }
}
