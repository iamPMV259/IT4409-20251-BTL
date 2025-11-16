package com.example.demo.model;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "users")
public class User {
    @Id
    private UUID id;
    private String name;
    @Indexed(unique = true) // Đảm bảo email là duy nhất và được index
    private String email;
    @Field("passwordHash")
    private String passwordHash;
    @Field("avatarUrl")
    private String avatarUrl;
    @CreatedDate
    @Field("createdAt")
    private Instant createdAt;
    @LastModifiedDate
    @Field("updatedAt")
    private Instant updatedAt;
}
