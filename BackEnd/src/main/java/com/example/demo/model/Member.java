package com.example.demo.model;

import java.util.UUID;

import org.springframework.data.mongodb.core.mapping.Field;


public class Member {
    @Field("userId")
    private UUID userId;
    private String role; 
}


