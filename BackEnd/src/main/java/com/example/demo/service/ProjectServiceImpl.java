package com.example.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;

    @Service
public class ProjectServiceImpl implements ProjectService {

    

    @Override
    public List<ProjectDto> getProjectsInWorkspace(Long workspaceId, String statusFilter, String sortBy) {
       
        System.out.println("Đang lấy dự án cho workspace " + workspaceId);
        return List.of(new ProjectDto());
    }

    @Override
    public ProjectDetailDto createProjectInWorkspace(Long workspaceId, CreateProjectRequest request) {
        
        System.out.println("Đang tạo dự án " + request.getName());
        return new ProjectDetailDto(); 
    }

    @Override
    public ProjectDetailDto getProjectDetails(Long projectId) {
        
        System.out.println("Đang lấy chi tiết dự án " + projectId);
        return new ProjectDetailDto();
    }

    @Override
    public ProjectDetailDto updateProject(Long projectId, UpdateProjectRequest request) {
        
        System.out.println("Đang cập nhật dự án " + projectId);
        return new ProjectDetailDto();
    }

    @Override
    public void deleteProject(Long projectId) {
        
        System.out.println("Đang xóa dự án " + projectId);
    }

    @Override
    public void addProjectMember(Long projectId, AddMemberRequest request) {
        
        System.out.println("Đang thêm " + request.getEmail() + " vào dự án " + projectId);
    }
}
