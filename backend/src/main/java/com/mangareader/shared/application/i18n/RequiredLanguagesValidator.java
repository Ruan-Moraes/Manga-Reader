package com.mangareader.shared.application.i18n;

import java.util.Map;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class RequiredLanguagesValidator implements ConstraintValidator<RequiredLanguages, Map<String, String>> {
    private String[] required;

    @Override
    public void initialize(RequiredLanguages annotation) {
        this.required = annotation.value();
    }

    @Override
    public boolean isValid(Map<String, String> value, ConstraintValidatorContext context) {
        if (value == null) {
            return false;
        }

        for (String tag : required) {
            String v = value.get(tag);

            if (v == null || v.isBlank()) {
                return false;
            }
        }

        return true;
    }
}
