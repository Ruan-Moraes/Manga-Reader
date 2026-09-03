package com.mangareader.translationgateway.application.config;

import java.nio.file.Path;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "gateway")
public class GatewayProperties {
    private boolean enabled;
    private String key = "local-disabled";
    private Duration sessionTtl = Duration.ofMinutes(15);
    private Duration capabilitiesTtl = Duration.ofMinutes(5);
    private int installationDailyQuota = 20;
    private int globalDailyQuota = 100;
    private final Media media = new Media();
    private final Disclosure disclosure = new Disclosure();
    private final Storage storage = new Storage();
    private final Dispatch dispatch = new Dispatch();

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }
    public Duration getSessionTtl() { return sessionTtl; }
    public void setSessionTtl(Duration sessionTtl) { this.sessionTtl = sessionTtl; }
    public Duration getCapabilitiesTtl() { return capabilitiesTtl; }
    public void setCapabilitiesTtl(Duration capabilitiesTtl) { this.capabilitiesTtl = capabilitiesTtl; }
    public int getInstallationDailyQuota() { return installationDailyQuota; }
    public void setInstallationDailyQuota(int value) { this.installationDailyQuota = value; }
    public int getGlobalDailyQuota() { return globalDailyQuota; }
    public void setGlobalDailyQuota(int value) { this.globalDailyQuota = value; }
    public Media getMedia() { return media; }
    public Disclosure getDisclosure() { return disclosure; }
    public Storage getStorage() { return storage; }
    public Dispatch getDispatch() { return dispatch; }

    public static class Media {
        private long maxBytes = 12_582_912;
        private int maxWidthPx = 12_000;
        private int maxHeightPx = 12_000;
        private long maxPixels = 80_000_000;

        public long getMaxBytes() { return maxBytes; }
        public void setMaxBytes(long value) { this.maxBytes = value; }
        public int getMaxWidthPx() { return maxWidthPx; }
        public void setMaxWidthPx(int value) { this.maxWidthPx = value; }
        public int getMaxHeightPx() { return maxHeightPx; }
        public void setMaxHeightPx(int value) { this.maxHeightPx = value; }
        public long getMaxPixels() { return maxPixels; }
        public void setMaxPixels(long value) { this.maxPixels = value; }
    }

    public static class Disclosure {
        private String version = "";
        private String operatorName = "";
        private String operatorContact = "";
        private String privacyPolicyUrl = "";
        private String termsUrl = "";
        private String providerTrainingPolicy = "";
        private int originalRetentionSeconds = 3600;
        private int resultRetentionSeconds = 3600;
        private int metadataRetentionDays = 7;

        public String getVersion() { return version; }
        public void setVersion(String value) { this.version = value; }
        public String getOperatorName() { return operatorName; }
        public void setOperatorName(String value) { this.operatorName = value; }
        public String getOperatorContact() { return operatorContact; }
        public void setOperatorContact(String value) { this.operatorContact = value; }
        public String getPrivacyPolicyUrl() { return privacyPolicyUrl; }
        public void setPrivacyPolicyUrl(String value) { this.privacyPolicyUrl = value; }
        public String getTermsUrl() { return termsUrl; }
        public void setTermsUrl(String value) { this.termsUrl = value; }
        public String getProviderTrainingPolicy() { return providerTrainingPolicy; }
        public void setProviderTrainingPolicy(String value) { this.providerTrainingPolicy = value; }
        public int getOriginalRetentionSeconds() { return originalRetentionSeconds; }
        public void setOriginalRetentionSeconds(int value) { this.originalRetentionSeconds = value; }
        public int getResultRetentionSeconds() { return resultRetentionSeconds; }
        public void setResultRetentionSeconds(int value) { this.resultRetentionSeconds = value; }
        public int getMetadataRetentionDays() { return metadataRetentionDays; }
        public void setMetadataRetentionDays(int value) { this.metadataRetentionDays = value; }
    }

    public static class Storage {
        private String mode = "local";
        private Path localDirectory;
        private String bucket = "";

        public String getMode() { return mode; }
        public void setMode(String value) { this.mode = value; }
        public Path getLocalDirectory() { return localDirectory; }
        public void setLocalDirectory(Path value) { this.localDirectory = value; }
        public String getBucket() { return bucket; }
        public void setBucket(String value) { this.bucket = value; }
    }

    public static class Dispatch {
        private String mode = "disabled";
        private String projectId = "";
        private String location = "southamerica-east1";
        private String queue = "translation-jobs";
        private String workerUrl = "";
        private String serviceAccountEmail = "";
        private int maxAttempts = 8;
        private int batchSize = 50;

        public String getMode() { return mode; }
        public void setMode(String value) { this.mode = value; }
        public String getProjectId() { return projectId; }
        public void setProjectId(String value) { this.projectId = value; }
        public String getLocation() { return location; }
        public void setLocation(String value) { this.location = value; }
        public String getQueue() { return queue; }
        public void setQueue(String value) { this.queue = value; }
        public String getWorkerUrl() { return workerUrl; }
        public void setWorkerUrl(String value) { this.workerUrl = value; }
        public String getServiceAccountEmail() { return serviceAccountEmail; }
        public void setServiceAccountEmail(String value) { this.serviceAccountEmail = value; }
        public int getMaxAttempts() { return maxAttempts; }
        public void setMaxAttempts(int value) { this.maxAttempts = value; }
        public int getBatchSize() { return batchSize; }
        public void setBatchSize(int value) { this.batchSize = value; }
    }
}
