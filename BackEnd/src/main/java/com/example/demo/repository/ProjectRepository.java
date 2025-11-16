package com.example.demo.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.example.demo.model.Project;
@Repository
public interface ProjectRepository extends MongoRepository {
    List<Project> findByWorkspaceId(UUID workspaceId);

    // Cần cho nghiệp vụ xóa
    void deleteAllByWorkspaceId(UUID workspaceId);
}
