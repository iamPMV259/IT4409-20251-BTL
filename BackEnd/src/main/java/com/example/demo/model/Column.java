package com.example.demo.model;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "columns")
public class Column {
    @Id
    private UUID id;
    private String title;
    @Indexed
    @Field("projectId")
    private UUID projectId; // Tham chiếu Project
    @Field("taskOrder")
    private List<UUID> taskOrder; // Mảng các ID của Task
    @CreatedDate
    @Field("createdAt")
    private Instant createdAt;
    @LastModifiedDate
    @Field("updatedAt")
    private Instant updatedAt;
}
