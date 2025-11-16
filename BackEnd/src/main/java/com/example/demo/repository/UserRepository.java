package com.example.demo.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.example.demo.model.User;

@Repository
public interface UserRepository extends MongoRepository<User, UUID> {
    
    Optional<User> findByEmail(String email);
}
/*
 *  con thiếu 4 cái này để sang tuần 
 * - ColumnRepository
 * - LabelRepository
 * - CommentRepository
 * - ActivityRepository
 */