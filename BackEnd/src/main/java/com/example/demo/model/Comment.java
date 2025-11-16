package com.example.demo.model;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "comments")
public class Comment {
    @Id
    private UUID id;
    @Indexed
    @Field("taskId")
    private UUID taskId; // Tham chiếu Task
    @Field("userId")
    private UUID userId; // Tham chiếu User
    private String content;
    @CreatedDate
    @Field("createdAt")
    private Instant createdAt;
    
}
