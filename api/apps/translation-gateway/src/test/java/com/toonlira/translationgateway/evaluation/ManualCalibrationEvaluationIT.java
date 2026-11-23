package com.toonlira.translationgateway.evaluation;

import java.nio.file.Path;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

/** Explicit local CLI only; never selected by the regular test suite. */
@EnabledIfEnvironmentVariable(named = "OCR_EVAL_CALIBRATION_ID", matches = "[a-z0-9][a-z0-9-]{0,63}")
class ManualCalibrationEvaluationIT extends EvaluationHarness {
    @Test void evaluateAdmittedControl() throws Exception {
        var root = Path.of(System.getProperty("basedir")).resolve("../../..").normalize().toAbsolutePath();
        var controls = root.resolve(".local/ocr-samples/calibration");
        var id = System.getenv("OCR_EVAL_CALIBRATION_ID");
        var runId = System.getenv("OCR_EVAL_RUN_ID");
        if (runId == null || !runId.matches("[a-z0-9][a-z0-9-]{0,63}")) throw new IllegalArgumentException("calibration-run-invalid");
        var output = controls.resolve(id).resolve("runs").resolve(runId);
        CalibrationAdmission.directory(output);
        var requestBytes = CalibrationAdmission.read(output.resolve("request.json"), 65536);
        var request = mapper.readTree(requestBytes);
        if (!id.equals(request.path("calibrationId").asText()) || !runId.equals(request.path("runId").asText())) {
            throw new IllegalArgumentException("calibration-run-invalid");
        }
        var input = CalibrationAdmission.admit(controls, request);
        var mode = request.path("mode").asText();
        var project = System.getenv().getOrDefault("OCR_EVAL_PROJECT", "");
        var bucket = System.getenv().getOrDefault("OCR_EVAL_BUCKET", "");
        boolean confirmed = "yes".equals(System.getenv("OCR_EVAL_CONFIRM_PAID_CALL"));
        validateMode(mode, project, bucket, confirmed);
        var credentials = System.getenv().getOrDefault("OCR_EVAL_CREDENTIALS_FILE", "");
        var account = System.getenv().getOrDefault("OCR_EVAL_SERVICE_ACCOUNT", "");
        if (mode.equals("vision") && (credentials.isBlank() || account.isBlank())) throw new IllegalArgumentException("evaluation-configuration-invalid");
        if (mode.equals("offline") && (!project.isBlank() || !bucket.isBlank() || confirmed || !credentials.isBlank() || !account.isBlank())) {
            throw new IllegalArgumentException("evaluation-configuration-invalid");
        }
        writePrivate(output.resolve("invocation.lock"), mapper.writeValueAsBytes(Map.of("state", "started-no-automatic-resume")));
        var result = evaluate(input.image(), input.sample(), output, mode, project, bucket, confirmed, "success",
            mode.equals("vision") ? Path.of(credentials) : null, account, root);
        result.put("requestSha256", hash(requestBytes));
        result.put("referenceSha256", hash(input.reference()));
        try {
            CalibrationAdmission.admit(controls, request); // Detect changed source after processing, never retry OCR.
            CalibrationAdmission.exportDiagnostic(output, result);
        } catch (Exception ignored) {
            result.put("status", "failed"); result.put("errorCode", "calibration-export-invalid");
        }
        writePrivate(output.resolve("result.json"), mapper.writeValueAsBytes(result));
        if (!"succeeded".equals(result.get("status"))) throw new IllegalStateException("evaluation-failed-see-local-result");
    }
}
