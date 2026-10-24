package com.toonlira.translationgateway.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;

import com.toonlira.translationgateway.TranslationGatewayApplication;
import java.io.DataInputStream;
import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringBootVersion;

class GatewayRuntimeTest {
    @Test void gatewayIsCompiledAndTestedWithTheSupportedJava25Stack() throws Exception {
        assertThat(Runtime.version().feature()).isEqualTo(25);
        assertThat(SpringBootVersion.getVersion()).isEqualTo("4.1.1");
        for (var type : new Class<?>[]{GatewayRuntimeTest.class, TranslationGatewayApplication.class}) {
            try (var input = new DataInputStream(type.getResourceAsStream(type.getSimpleName() + ".class"))) {
                assertThat(input.readInt()).isEqualTo(0xcafebabe);
                input.readUnsignedShort();
                assertThat(input.readUnsignedShort()).isEqualTo(69);
            }
        }
    }
}
