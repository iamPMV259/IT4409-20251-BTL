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

@Document(collection = "projects")
public class Project {
    @Id
    private UUID id;
    private String name;
    private String description;
    @Indexed 
    @Field("workspaceId")
    private UUID workspaceId; 
    @Field("ownerId")
    private UUID ownerId; 
    private List<Member> members;
    private String status; 
    private Instant deadline;
    @Field("columnOrder")
    private List<UUID> columnOrder; 
    @Field("taskStats")
    private TaskStats taskStats; 
    @CreatedDate
    @Field("createdAt")
    private Instant createdAt;
    @LastModifiedDate
    @Field("updatedAt")
    private Instant updatedAt;
}
