package com.mangareader.translationgateway.infrastructure.dispatch;

import com.google.api.gax.rpc.AlreadyExistsException;
import com.google.cloud.tasks.v2.CloudTasksClient;
import com.google.cloud.tasks.v2.HttpMethod;
import com.google.cloud.tasks.v2.HttpRequest;
import com.google.cloud.tasks.v2.OidcToken;
import com.google.cloud.tasks.v2.QueueName;
import com.google.cloud.tasks.v2.Task;
import com.google.protobuf.ByteString;
import com.mangareader.translationgateway.application.port.TaskDispatchPort;
import com.mangareader.translationgateway.application.config.GatewayProperties;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "gateway.dispatch", name = "mode", havingValue = "cloud-tasks")
public class GoogleCloudTasksAdapter implements TaskDispatchPort, AutoCloseable {
    private final CloudTasksClient client;
    private final GatewayProperties.Dispatch configuration;

    public GoogleCloudTasksAdapter(GatewayProperties properties) throws IOException {
        this(CloudTasksClient.create(), properties.getDispatch());
    }

    GoogleCloudTasksAdapter(CloudTasksClient client, GatewayProperties.Dispatch configuration) {
        this.client = client;
        this.configuration = configuration;
    }

    @Override
    public DispatchResult dispatch(UUID jobRef) {
        var parent = QueueName.of(configuration.getProjectId(), configuration.getLocation(), configuration.getQueue());
        var body = ByteString.copyFrom(("{\"jobRef\":\"" + jobRef + "\"}").getBytes(StandardCharsets.UTF_8));
        var request = HttpRequest.newBuilder().setHttpMethod(HttpMethod.POST).setUrl(configuration.getWorkerUrl())
            .putHeaders("Content-Type", "application/json").setBody(body)
            .setOidcToken(OidcToken.newBuilder().setServiceAccountEmail(configuration.getServiceAccountEmail()).build()).build();
        var taskName = parent.toString() + "/tasks/job-" + jobRef;
        try {
            client.createTask(parent, Task.newBuilder().setName(taskName).setHttpRequest(request).build());
            return DispatchResult.CREATED;
        } catch (AlreadyExistsException duplicate) {
            return DispatchResult.ALREADY_EXISTS;
        }
    }

    @Override
    public void close() {
        client.close();
    }
}
