package com.example.demo.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.User;
import com.example.demo.service.ProjectServiceImpl;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/projects")
public class WorkspaceProjectController {

    private final ProjectServiceImpl projectService;

    // ----- HÀM GIẢ LẬP -----
    // Trong thực tế, bạn sẽ dùng Spring Security để lấy user
    // ví dụ: @AuthenticationPrincipal UserDetails userDetails
    private User getAuthenticatedUser() {
        // TODO: Thay thế bằng logic Spring Security
        User user = new User();
        // Gán UUID của user đang đăng nhập (để test)
        user.setId(UUID.fromString("00000000-0000-0000-0000-000000000001")); 
        return user;
    }
    // ----- KẾT THÚC HÀM GIẢ LẬP -----

    /**
     * Method: GET
     * Endpoint: /api/v1/workspaces/{workspaceId}/projects
     * Mô tả: Lấy danh sách dự án tổng quan cho "My Workspace".
     */
    @GetMapping
    public ResponseEntity<List<ProjectOverviewDto>> getProjectsInWorkspace(
            @PathVariable UUID workspaceId) {
        
        User currentUser = getAuthenticatedUser();
        List<ProjectOverviewDto> projects = projectService.getProjectsInWorkspace(workspaceId, currentUser);
        return ResponseEntity.ok(projects);
    }

    /**
     * Method: POST
     * Endpoint: /api/v1/workspaces/{workspaceId}/projects
     * Mô tả: Tạo một dự án mới.
     */
    @PostMapping
    public ResponseEntity<Project> createProjectInWorkspace(
            @PathVariable UUID workspaceId,
            @Valid @RequestBody CreateProjectRequest dto) { // @Valid để kích hoạt validation
        
        User owner = getAuthenticatedUser();
        Project newProject = projectService.createProjectInWorkspace(workspaceId, dto, owner);
        return new ResponseEntity<>(newProject, HttpStatus.CREATED); // Trả về 201 Created
    }
}