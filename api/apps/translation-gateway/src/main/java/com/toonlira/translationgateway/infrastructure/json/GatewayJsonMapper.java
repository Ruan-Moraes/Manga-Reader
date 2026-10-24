package com.toonlira.translationgateway.infrastructure.json;

import tools.jackson.core.json.JsonWriteFeature;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.MapperFeature;
import tools.jackson.databind.json.JsonMapper;

/** Explicit wire defaults shared by the HTTP bean and isolated artifact/probe codecs. */
public final class GatewayJsonMapper {
    private GatewayJsonMapper() { }

    public static JsonMapper create() {
        return JsonMapper.builder()
            .enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
            .disable(MapperFeature.SORT_PROPERTIES_ALPHABETICALLY)
            .disable(JsonWriteFeature.COMBINE_UNICODE_SURROGATES_IN_UTF8,
                JsonWriteFeature.ESCAPE_FORWARD_SLASHES)
            .enable(JsonWriteFeature.WRITE_HEX_UPPER_CASE)
            .build();
    }
}
