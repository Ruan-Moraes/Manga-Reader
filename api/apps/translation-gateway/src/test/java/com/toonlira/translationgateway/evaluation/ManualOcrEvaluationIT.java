package com.toonlira.translationgateway.evaluation;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

/** Excluded by Surefire's default naming. Only the explicit CLI selects this class. */
@EnabledIfEnvironmentVariable(named = "OCR_EVAL_RUN_ID", matches = "[a-z0-9][a-z0-9-]{0,63}")
class ManualOcrEvaluationIT extends EvaluationHarness {
    @Test void evaluateSelectedLicensedImage() throws Exception {
        var root = Path.of(System.getProperty("basedir")).resolve("../../..").normalize().toAbsolutePath();
        var samples = root.resolve(".local/ocr-samples");
        var id = System.getenv("OCR_EVAL_RUN_ID");
        var output = samples.resolve("runs").resolve(id);
        for (var path : new Path[]{root.resolve(".local"), samples, samples.resolve("runs"), output, samples.resolve("images")}) {
            if (!Files.isDirectory(path) || Files.isSymbolicLink(path)) throw new IllegalArgumentException("evaluation-path-invalid");
        }
        var requestPath = output.resolve("request.json");
        if (Files.isSymbolicLink(requestPath) || Files.size(requestPath) > 65536) throw new IllegalArgumentException("evaluation-request-invalid");
        var request = mapper.readTree(Files.readAllBytes(requestPath));
        var catalog = mapper.readTree(Files.readAllBytes(root.resolve("api/apps/translation-gateway/docs/ocr-evaluation/samples.json")));
        var sample = request.path("sample");
        boolean admitted = false;
        for (var candidate : catalog.path("samples")) if (candidate.equals(sample)) admitted = true;
        if (!admitted || !id.equals(request.path("runId").asText()) || !sample.path("file").asText().matches("[a-z0-9-]+\\.(jpg|png)")) {
            throw new IllegalArgumentException("evaluation-sample-invalid");
        }
        var mode = request.path("mode").asText();
        var project = System.getenv().getOrDefault("OCR_EVAL_PROJECT", "");
        var bucket = System.getenv().getOrDefault("OCR_EVAL_BUCKET", "");
        boolean confirmed = "yes".equals(System.getenv("OCR_EVAL_CONFIRM_PAID_CALL"));
        validateMode(mode, project, bucket, confirmed);
        var credentialsFile = System.getenv().getOrDefault("OCR_EVAL_CREDENTIALS_FILE", "");
        var serviceAccount = System.getenv().getOrDefault("OCR_EVAL_SERVICE_ACCOUNT", "");
        if (mode.equals("vision") && (credentialsFile.isBlank() || serviceAccount.isBlank())) {
            throw new IllegalArgumentException("evaluation-configuration-invalid");
        }
        writePrivate(output.resolve("invocation.lock"), mapper.writeValueAsBytes(Map.of("state", "started-no-automatic-resume")));
        var result = evaluate(samples.resolve("images").resolve(sample.path("file").asText()), sample, output,
            mode, project, bucket, confirmed, "success", mode.equals("vision") ? Path.of(credentialsFile) : null, serviceAccount, root);
        writePrivate(output.resolve("result.json"), mapper.writeValueAsBytes(result));
        if (!"succeeded".equals(result.get("status"))) throw new IllegalStateException("evaluation-failed-see-local-result");
    }
}
