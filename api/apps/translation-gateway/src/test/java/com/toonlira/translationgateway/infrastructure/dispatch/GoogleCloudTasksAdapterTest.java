package com.toonlira.translationgateway.infrastructure.dispatch;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import com.google.api.gax.rpc.AlreadyExistsException;
import com.google.cloud.tasks.v2.CloudTasksClient;
import com.google.cloud.tasks.v2.QueueName;
import com.google.cloud.tasks.v2.Task;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.TaskDispatchPort;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class GoogleCloudTasksAdapterTest {
    @Test
    void shouldUseTheJobReferenceAsDeterministicTaskName() {
        var client = mock(CloudTasksClient.class);
        var configuration = configuration();
        var jobRef = UUID.randomUUID();

        var result = new GoogleCloudTasksAdapter(client, configuration).dispatch(jobRef);

        var task = ArgumentCaptor.forClass(Task.class);
        verify(client).createTask(any(QueueName.class), task.capture());
        assertThat(result).isEqualTo(TaskDispatchPort.DispatchResult.CREATED);
        assertThat(task.getValue().getName()).endsWith("/tasks/job-" + jobRef);
        assertThat(task.getValue().getHttpRequest().getBody().toString(StandardCharsets.UTF_8))
            .isEqualTo("{\"jobRef\":\"" + jobRef + "\"}");
    }

    @Test
    void shouldTreatCloudTasksRedeliveryAsSuccess() {
        var client = mock(CloudTasksClient.class);
        doThrow(mock(AlreadyExistsException.class)).when(client).createTask(any(QueueName.class), any(Task.class));

        var result = new GoogleCloudTasksAdapter(client, configuration()).dispatch(UUID.randomUUID());

        assertThat(result).isEqualTo(TaskDispatchPort.DispatchResult.ALREADY_EXISTS);
    }

    private GatewayProperties.Dispatch configuration() {
        var configuration = new GatewayProperties.Dispatch();
        configuration.setProjectId("test-project");
        configuration.setLocation("southamerica-east1");
        configuration.setQueue("translation-jobs");
        configuration.setWorkerUrl("https://worker.example.com/tasks");
        configuration.setServiceAccountEmail("tasks@test-project.iam.gserviceaccount.com");
        return configuration;
    }
}
