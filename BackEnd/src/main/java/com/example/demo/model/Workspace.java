package com.example.demo.model;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "workspaces")
public class Workspace {
    @Id
    private UUID id;
    private String name;
    @Field("ownerId")
    private UUID ownerId; // Tham chiếu User
    private List<Member> members;
    @CreatedDate
    @Field("createdAt")
    private Instant createdAt;
    @LastModifiedDate
    @Field("updatedAt")
    private Instant updatedAt;
}
