package com.maxwin.bankapp.controller;

import com.maxwin.bankapp.dto.UserPublicResponse;
import com.maxwin.bankapp.entity.User;
import com.maxwin.bankapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@CrossOrigin
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/test")
    public String testEndpoint() {
        return "SUCCESS! The secured API is live.";
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        User user = userRepository.findById(authentication.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("FAILED: User not found.");
        }
        return ResponseEntity.ok(new UserPublicResponse(user));
    }

    // Public user directory for contact book only. Passwords/emails are not exposed.
    @GetMapping("/all")
    public List<UserPublicResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserPublicResponse::new)
                .collect(Collectors.toList());
    }
}
