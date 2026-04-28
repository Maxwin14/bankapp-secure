package com.maxwin.bankapp.dto;

import com.maxwin.bankapp.entity.User;

public class UserPublicResponse {
    private String userId;
    private String username;

    public UserPublicResponse(User user) {
        this.userId = user.getUserId();
        this.username = user.getUsername();
    }

    public String getUserId() { return userId; }
    public String getUsername() { return username; }
}
