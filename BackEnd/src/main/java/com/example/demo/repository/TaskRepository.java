package com.example.demo.repository;

import java.util.UUID;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.example.demo.model.Task;

@Repository
public interface TaskRepository extends MongoRepository<Task, UUID> {
    
    
    void deleteAllByProjectId(UUID projectId);
}
