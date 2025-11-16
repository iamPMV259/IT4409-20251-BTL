package com.example.demo.model;

import java.util.UUID;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "labels")
public class Label {
    @Id
    private UUID id;
    @Indexed
    @Field("projectId")
    private UUID projectId; // Tham chiếu Project
    private String text;
    private String color; 
}
