package com.example.demo.model;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "activities")
public class Activity {
    @Id
    private UUID id;
    @Indexed
    @Field("projectId")
    private UUID projectId; // Tham chiếu Project
    @Indexed
    @Field("taskId")
    private UUID taskId; // Tham chiếu Task
    @Field("userId")
    private UUID userId; // Tham chiếu User
    private String action; // 'CREATED_TASK', 'MOVED_TASK', v.v.
    private ActivityDetails details;
    @CreatedDate
    @Field("createdAt")
    private Instant createdAt;
}
