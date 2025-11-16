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

@Document(collection = "tasks")
public class Task {
    @Id
    private UUID id;
    private String title;
    private String description;
    @Indexed
    @Field("projectId")
    private UUID projectId; // Tham chiếu Project
    @Indexed
    @Field("columnId")
    private UUID columnId; // Tham chiếu Column
    @Field("creatorId")
    private UUID creatorId; // Tham chiếu User
    @Indexed // Tối ưu hóa cho "My Tasks"
    private List<UUID> assignees; // Mảng các ID của User
    @Indexed
    @Field("dueDate")
    private Instant dueDate;
    private List<UUID> labels; // Mảng các ID của Label
    private List<Checklist> checklists;
    @CreatedDate
    @Field("createdAt")
    private Instant createdAt;
    @LastModifiedDate
    @Field("updatedAt")
    private Instant updatedAt;
}
